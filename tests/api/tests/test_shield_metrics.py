"""
Tests for GET /api/v1/control-centre/shield-metrics — the Shield funnel
dashboard endpoint. Super-admin only. Verifies funnel math, top-flagged
aggregation, and risk-counts grouping.
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.core.assessments import ASSESSMENT_CATEGORIES
from app.models.user import User
from tests.conftest import auth_headers

OPPS = "/api/v1/opportunities"
METRICS = "/api/v1/control-centre/shield-metrics"


async def _create_opportunity(client: AsyncClient, user: User, title: str) -> str:
    resp = await client.post(
        OPPS,
        json={
            "vault_type": "wealth",
            "title": title,
            "city": "Pune",
            "target_amount": 10_000_000,
            "min_investment": 500_000,
            "target_irr": 14.0,
        },
        headers=auth_headers(user),
    )
    assert resp.status_code in (200, 201), resp.text
    return resp.json()["id"]


async def _pass_all(client: AsyncClient, admin: User, opp_id: str) -> None:
    for cat in ASSESSMENT_CATEGORIES:
        for sub in cat.sub_items:
            resp = await client.post(
                f"{OPPS}/{opp_id}/assessments/{sub.code}/review",
                json={"action": "pass"},
                headers=auth_headers(admin),
            )
            assert resp.status_code == 200


@pytest.mark.asyncio
class TestShieldMetricsAuth:
    async def test_requires_super_admin(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get(METRICS, headers=auth_headers(test_user))
        assert resp.status_code in (401, 403)

    async def test_unauthenticated_is_rejected(self, client: AsyncClient):
        resp = await client.get(METRICS)
        assert resp.status_code in (401, 403)


@pytest.mark.asyncio
class TestShieldMetricsFunnel:
    async def test_shape(self, client: AsyncClient, admin_user: User):
        resp = await client.get(METRICS, headers=auth_headers(admin_user))
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert set(data.keys()) == {
            "funnel",
            "top_flagged",
            "avg_time_to_certify_days",
            "risk_counts",
        }
        assert set(data["funnel"].keys()) == {
            "not_started",
            "in_review",
            "partial",
            "certified",
        }
        assert set(data["risk_counts"].keys()) == {"low", "medium", "high"}

    async def test_partial_opportunity_counts_as_partial(
        self,
        client: AsyncClient,
        test_user: User,
        admin_user: User,
    ):
        opp_id = await _create_opportunity(client, test_user, "Partial deal")
        # Save one answer → sub-item becomes in_progress → funnel='partial'.
        save = await client.put(
            f"{OPPS}/{opp_id}/assessments/bulk",
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
        assert save.status_code == 200

        resp = await client.get(METRICS, headers=auth_headers(admin_user))
        assert resp.status_code == 200
        data = resp.json()
        assert data["funnel"]["partial"] >= 1

    async def test_fully_passed_opportunity_counts_as_certified(
        self,
        client: AsyncClient,
        test_user: User,
        admin_user: User,
    ):
        opp_id = await _create_opportunity(client, test_user, "Certified deal")
        await _pass_all(client, admin_user, opp_id)

        resp = await client.get(METRICS, headers=auth_headers(admin_user))
        assert resp.status_code == 200
        data = resp.json()
        assert data["funnel"]["certified"] >= 1
        # avg_time_to_certify should now be a number
        assert data["avg_time_to_certify_days"] is not None

    async def test_flagged_subitem_appears_in_top_flagged(
        self,
        client: AsyncClient,
        test_user: User,
        admin_user: User,
    ):
        opp_id = await _create_opportunity(client, test_user, "Flagged deal")
        flag = await client.post(
            f"{OPPS}/{opp_id}/assessments/title_deeds/review",
            json={
                "action": "flag",
                "reviewer_note": "Parent deed missing.",
                "risk_severity": "high",
            },
            headers=auth_headers(admin_user),
        )
        assert flag.status_code == 200

        resp = await client.get(METRICS, headers=auth_headers(admin_user))
        assert resp.status_code == 200
        data = resp.json()
        top = data["top_flagged"]
        found = any(
            item["subcategory_code"] == "title_deeds"
            and item["category_code"] == "legal"
            and item["flagged_count"] >= 1
            for item in top
        )
        assert found, f"title_deeds not in top_flagged: {top}"
        # in_review funnel bucket picks up flagged opps
        assert data["funnel"]["in_review"] >= 1

    async def test_risk_counts_by_severity(
        self,
        client: AsyncClient,
        test_user: User,
        admin_user: User,
    ):
        opp_id = await _create_opportunity(client, test_user, "Risky deal")
        # Add one medium + one high risk
        for sev in ("medium", "high"):
            resp = await client.post(
                f"{OPPS}/{opp_id}/risks",
                json={
                    "label": f"Risk {sev}",
                    "severity": sev,
                    "note": f"{sev} severity issue",
                },
                headers=auth_headers(admin_user),
            )
            assert resp.status_code in (200, 201)

        resp = await client.get(METRICS, headers=auth_headers(admin_user))
        assert resp.status_code == 200
        counts = resp.json()["risk_counts"]
        assert counts["medium"] >= 1
        assert counts["high"] >= 1
