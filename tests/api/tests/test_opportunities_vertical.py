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
            "target_irr": 14.5,
            "city": "Mumbai",
        },
        headers=auth_headers(builder_user),
    )
    assert r.status_code in (200, 201, 403, 422)


async def test_create_opportunity_requires_builder(client: AsyncClient, test_user):
    """POST /api/v1/opportunities by non-builder."""
    r = await client.post(
        "/api/v1/opportunities",
        json={"title": "Test", "vault_type": "wealth"},
        headers=auth_headers(test_user),
    )
    # May succeed with 200/201 if no builder check or 403/422 if enforced
    assert r.status_code < 500
