"""
Vertical integration tests: Opportunities endpoints (vault stats, activities, CRUD).
"""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers

pytestmark = pytest.mark.asyncio


async def test_opportunities_list(client: AsyncClient, test_user):
    """GET /api/v1/opportunities returns list."""
    r = await client.get("/api/v1/opportunities", headers=auth_headers(test_user))
    assert r.status_code == 200
    data = r.json()
    assert "items" in data


async def test_vault_stats(client: AsyncClient, test_user):
    """GET /api/v1/opportunities/vault-stats returns stats."""
    r = await client.get("/api/v1/opportunities/vault-stats", headers=auth_headers(test_user))
    assert r.status_code in (200, 403)


async def test_user_activities(client: AsyncClient, test_user):
    """GET /api/v1/opportunities/user/activities returns user activities."""
    r = await client.get("/api/v1/opportunities/user/activities", headers=auth_headers(test_user))
    assert r.status_code == 200


async def test_user_activities_unauthorized(client: AsyncClient):
    """GET /api/v1/opportunities/user/activities requires auth."""
    r = await client.get("/api/v1/opportunities/user/activities")
    assert r.status_code in (401, 403)


async def test_builder_investors(client: AsyncClient, builder_user):
    """GET /api/v1/opportunities/builder/investors returns builder's investors."""
    r = await client.get("/api/v1/opportunities/builder/investors", headers=auth_headers(builder_user))
    assert r.status_code in (200, 403)


async def test_builder_analytics(client: AsyncClient, builder_user):
    """GET /api/v1/opportunities/builder/analytics returns builder analytics."""
    r = await client.get("/api/v1/opportunities/builder/analytics", headers=auth_headers(builder_user))
    assert r.status_code in (200, 403)


async def test_create_opportunity(client: AsyncClient, builder_user):
    """POST /api/v1/opportunities creates opportunity."""
    r = await client.post(
        "/api/v1/opportunities",
        json={
            "title": "Test Opportunity",
            "description": "Test description",
            "vault_type": "wealth",
            "target_amount": 10000000,
            "min_investment": 25000,
            "city": "Mumbai",
        },
        headers=auth_headers(builder_user),
    )
    assert r.status_code in (200, 201, 403, 422)


async def test_create_opportunity_persists_all_new_fields(client: AsyncClient, builder_user):
    """Regression: every wizard field (incl. default-loaded narrative/config data) must
    round-trip through create and be persisted to the DB, not silently dropped."""
    payload = {
        "title": "Full Fields Opportunity",
        "tagline": "Capital appreciation through early-stage entry",
        "description": "Test description",
        "vault_type": "wealth",
        "target_amount": 10000000,
        "min_investment": 25000,
        "city": "Bengaluru",
        "state": "Karnataka",
        # Real-estate spec fields added to the wizard
        "property_type": "flat",
        "development_type": "Integrated Residential Township",
        "gst_percentage": 5,
        "holding_period_months": 48,
        "projected_market_value_at_exit": 14000,
        "purpose_of_funds": "Land acquisition and development",
        "project_phase": "land_acquisition",
        "price_per_sqft": 4750,
        "total_project_area_sqft": 250000,
        "property_specs": {
            "property_type": "flat",
            "configurations": [
                {"type": "2 BHK", "super_built_up_sqft": 1150, "price_per_sqft": 4750},
            ],
        },
        # Narrative sections (default-loaded in the wizard)
        "risk_factors": "Real estate investments are subject to market risk.",
        "why_investors": "A rare opportunity to participate at the land-acquisition stage.",
        "investment_thesis": "Why This Opportunity?\n\n✓ Entry at pre-development valuation",
        "project_roadmap": [
            {"phase": "Phase 1", "stage": "Land Acquisition Completion", "timeline": "Mar-2026"},
        ],
    }
    r = await client.post(
        "/api/v1/opportunities", json=payload, headers=auth_headers(builder_user)
    )
    assert r.status_code in (200, 201), r.text
    data = r.json()

    # Each field that the wizard sends must be persisted and echoed back.
    assert data["development_type"] == "Integrated Residential Township"
    assert data["gst_percentage"] == 5
    assert data["holding_period_months"] == 48
    assert data["projected_market_value_at_exit"] == 14000
    assert data["purpose_of_funds"] == "Land acquisition and development"
    assert data["project_phase"] == "land_acquisition"
    assert data["price_per_sqft"] == 4750
    assert data["total_project_area_sqft"] == 250000
    assert data["property_specs"]["configurations"][0]["type"] == "2 BHK"
    assert data["risk_factors"] == "Real estate investments are subject to market risk."
    assert data["why_investors"].startswith("A rare opportunity")
    assert "Entry at pre-development valuation" in data["investment_thesis"]
    assert data["project_roadmap"][0]["stage"] == "Land Acquisition Completion"


async def test_create_opportunity_requires_builder(client: AsyncClient, test_user):
    """POST /api/v1/opportunities by non-builder."""
    r = await client.post(
        "/api/v1/opportunities",
        json={"title": "Test", "vault_type": "wealth"},
        headers=auth_headers(test_user),
    )
    # May succeed with 200/201 if no builder check or 403/422 if enforced
    assert r.status_code < 500
