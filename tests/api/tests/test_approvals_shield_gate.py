"""
Tests for the Shield approval gate — approving an opportunity while assessments
are incomplete must 409, unless the reviewer passes `override=true`.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.core.assessments import ASSESSMENT_CATEGORIES
from app.models.user import User
from tests.conftest import auth_headers

OPPS = "/api/v1/opportunities"
APPROVALS = "/api/v1/approvals"


async def _create_opportunity(client: AsyncClient, user: User) -> str:
    resp = await client.post(
        OPPS,
        json={
            "vault_type": "wealth",
            "title": "Shield Gate Test Opportunity",
            "city": "Hyderabad",
            "target_amount": 20_000_000,
            "min_investment": 500_000,
            "target_irr": 14.0,
        },
        headers=auth_headers(user),
    )
    assert resp.status_code in (200, 201), resp.text
    return resp.json()["id"]


async def _create_opportunity_approval(
    client: AsyncClient, user: User, opp_id: str
) -> str:
    resp = await client.post(
        APPROVALS,
        json={
            "category": "opportunity_listing",
            "title": "Please approve my listing",
            "priority": "normal",
            "resource_type": "opportunity",
            "resource_id": opp_id,
        },
        headers=auth_headers(user),
    )
    assert resp.status_code == 200, resp.text
    return resp.json()["id"]


async def _pass_all_subitems(
    client: AsyncClient, admin: User, opp_id: str
) -> None:
    for cat in ASSESSMENT_CATEGORIES:
        for sub in cat.sub_items:
            resp = await client.post(
                f"{OPPS}/{opp_id}/assessments/{sub.code}/review",
                json={"action": "pass"},
                headers=auth_headers(admin),
            )
            assert resp.status_code == 200, resp.text


@pytest.mark.asyncio
class TestShieldApprovalGate:
    async def test_incomplete_assessments_block_approval(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        opp_id = await _create_opportunity(client, test_user)
        approval_id = await _create_opportunity_approval(client, test_user, opp_id)

        resp = await client.post(
            f"{APPROVALS}/{approval_id}/review",
            json={"action": "approve", "review_note": "LGTM"},
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 409, resp.text
        assert "ASSESSMENT_INCOMPLETE" in resp.text

    async def test_override_bypasses_gate(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        opp_id = await _create_opportunity(client, test_user)
        approval_id = await _create_opportunity_approval(client, test_user, opp_id)

        resp = await client.post(
            f"{APPROVALS}/{approval_id}/review",
            json={
                "action": "approve",
                "review_note": "Forcing live — legal to catch up after.",
                "override": True,
            },
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["status"] == "approved"
        assert body["review_note"] == "Forcing live — legal to catch up after."

    async def test_approval_succeeds_when_all_passed(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        opp_id = await _create_opportunity(client, test_user)
        approval_id = await _create_opportunity_approval(client, test_user, opp_id)

        await _pass_all_subitems(client, admin_user, opp_id)

        resp = await client.post(
            f"{APPROVALS}/{approval_id}/review",
            json={"action": "approve"},
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "approved"

    async def test_flagged_subitem_still_blocks_without_override(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        opp_id = await _create_opportunity(client, test_user)
        approval_id = await _create_opportunity_approval(client, test_user, opp_id)

        # Pass everything…
        await _pass_all_subitems(client, admin_user, opp_id)
        # …then flag one sub-item. That should re-block approval.
        flag = await client.post(
            f"{OPPS}/{opp_id}/assessments/title_deeds/review",
            json={
                "action": "flag",
                "reviewer_note": "Parent deed missing.",
                "risk_severity": "high",
            },
            headers=auth_headers(admin_user),
        )
        assert flag.status_code == 200, flag.text

        resp = await client.post(
            f"{APPROVALS}/{approval_id}/review",
            json={"action": "approve"},
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 409
        assert "ASSESSMENT_INCOMPLETE" in resp.text

    async def test_rejection_ignores_shield_gate(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        """Rejecting an opportunity approval never runs the Shield gate."""
        opp_id = await _create_opportunity(client, test_user)
        approval_id = await _create_opportunity_approval(client, test_user, opp_id)

        resp = await client.post(
            f"{APPROVALS}/{approval_id}/review",
            json={"action": "reject", "review_note": "Docs look wrong."},
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["status"] == "rejected"
