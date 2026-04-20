"""
Tests for the WealthSpot Shield API — /api/v1/opportunities/{id}/assessments.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/opportunities"


async def _create_opportunity(client: AsyncClient, user: User) -> str:
    resp = await client.post(
        PREFIX,
        json={
            "vault_type": "wealth",
            "title": "Shield Test Villas",
            "city": "Bengaluru",
            "target_amount": 10_000_000,
            "min_investment": 500_000,
            "target_irr": 15.0,
        },
        headers=auth_headers(user),
    )
    assert resp.status_code in (200, 201), resp.text
    return resp.json()["id"]


@pytest.mark.asyncio
class TestShieldSummary:
    async def test_empty_summary_has_seven_categories(
        self, client: AsyncClient, test_user: User
    ):
        opp_id = await _create_opportunity(client, test_user)
        resp = await client.get(f"{PREFIX}/{opp_id}/assessments")
        assert resp.status_code == 200
        data = resp.json()
        assert data["opportunity_id"] == opp_id
        assert data["overall"] == "not_started"
        assert data["passed_count"] == 0
        assert data["certified"] is False
        # All 7 categories present with not_started children
        assert len(data["categories"]) == 7
        cat_codes = {c["code"] for c in data["categories"]}
        assert cat_codes == {
            "builder",
            "legal",
            "valuation",
            "location",
            "property",
            "security",
            "exit",
        }
        for cat in data["categories"]:
            for sub in cat["sub_items"]:
                assert sub["status"] == "not_started"

    async def test_bulk_save_marks_in_progress(
        self, client: AsyncClient, test_user: User
    ):
        opp_id = await _create_opportunity(client, test_user)
        resp = await client.put(
            f"{PREFIX}/{opp_id}/assessments/bulk",
            json={
                "items": [
                    {
                        "category_code": "builder",
                        "subcategory_code": "category_grade",
                        "builder_answer": {"text": "A"},
                    }
                ]
            },
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        cat = next(c for c in data["categories"] if c["code"] == "builder")
        sub = next(s for s in cat["sub_items"] if s["code"] == "category_grade")
        assert sub["status"] == "in_progress"
        assert sub["builder_answer"] == {"text": "A"}


@pytest.mark.asyncio
class TestShieldReview:
    async def test_admin_can_pass_a_subitem(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        opp_id = await _create_opportunity(client, test_user)
        resp = await client.post(
            f"{PREFIX}/{opp_id}/assessments/category_grade/review",
            json={"action": "pass", "reviewer_note": "Looks good."},
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        cat = next(c for c in data["categories"] if c["code"] == "builder")
        sub = next(s for s in cat["sub_items"] if s["code"] == "category_grade")
        assert sub["status"] == "passed"
        assert sub["reviewer_note"] == "Looks good."

    async def test_non_admin_cannot_review(
        self, client: AsyncClient, test_user: User
    ):
        opp_id = await _create_opportunity(client, test_user)
        resp = await client.post(
            f"{PREFIX}/{opp_id}/assessments/category_grade/review",
            json={"action": "pass"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code in (401, 403)

    async def test_flag_sets_risk_severity(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        opp_id = await _create_opportunity(client, test_user)
        resp = await client.post(
            f"{PREFIX}/{opp_id}/assessments/title_deeds/review",
            json={
                "action": "flag",
                "reviewer_note": "Missing parent deed.",
                "risk_severity": "high",
            },
            headers=auth_headers(admin_user),
        )
        assert resp.status_code == 200
        data = resp.json()
        cat = next(c for c in data["categories"] if c["code"] == "legal")
        sub = next(s for s in cat["sub_items"] if s["code"] == "title_deeds")
        assert sub["status"] == "flagged"
        assert sub["risk_severity"] == "high"


@pytest.mark.asyncio
class TestShieldRisks:
    async def test_admin_can_create_and_delete_risk(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        opp_id = await _create_opportunity(client, test_user)
        create = await client.post(
            f"{PREFIX}/{opp_id}/risks",
            json={
                "label": "Registrar office delay",
                "severity": "medium",
                "note": "Sub-registrar is backlogged.",
            },
            headers=auth_headers(admin_user),
        )
        assert create.status_code in (200, 201), create.text
        risk_id = create.json()["id"]

        summary = await client.get(f"{PREFIX}/{opp_id}/assessments")
        assert summary.status_code == 200
        assert any(r["id"] == risk_id for r in summary.json()["risks"])

        delete = await client.delete(
            f"{PREFIX}/{opp_id}/risks/{risk_id}",
            headers=auth_headers(admin_user),
        )
        assert delete.status_code == 200
