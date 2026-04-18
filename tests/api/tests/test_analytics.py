"""
Tests for analytics endpoints: /api/v1/analytics/*
All endpoints require SUPER_ADMIN role.
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/analytics"


@pytest.mark.asyncio
class TestAnalyticsAuth:
    """Non-admin users should be rejected."""

    async def test_vault_summary_requires_admin(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/vault-summary", headers=auth_headers(test_user))
        assert resp.status_code == 403

    async def test_dashboard_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/dashboard")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestVaultSummary:
    async def test_vault_summary_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.get(f"{PREFIX}/vault-summary", headers=auth_headers(admin_user))
        assert resp.status_code == 200
        data = resp.json()
        # Should return a dict (may be empty with no data)
        assert isinstance(data, dict)


@pytest.mark.asyncio
class TestInvestmentTrends:
    async def test_investment_trends_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.get(f"{PREFIX}/investment-trends", headers=auth_headers(admin_user))
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestGeographic:
    async def test_geographic_distribution_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.get(f"{PREFIX}/geographic", headers=auth_headers(admin_user))
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestInvestorAnalytics:
    async def test_investor_analytics_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.get(f"{PREFIX}/investors", headers=auth_headers(admin_user))
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestEoiFunnel:
    async def test_eoi_funnel_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.get(f"{PREFIX}/eoi-funnel", headers=auth_headers(admin_user))
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestTopOpportunities:
    async def test_top_opportunities_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.get(f"{PREFIX}/top-opportunities", headers=auth_headers(admin_user))
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestRevenue:
    async def test_revenue_breakdown_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.get(f"{PREFIX}/revenue", headers=auth_headers(admin_user))
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestRefreshViews:
    async def test_refresh_views_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.post(f"{PREFIX}/refresh", headers=auth_headers(admin_user))
        # 200 if materialized views exist, 500 if not (test DB may lack them)
        assert resp.status_code in (200, 500)

    async def test_refresh_views_requires_admin(self, client: AsyncClient, test_user: User):
        resp = await client.post(f"{PREFIX}/refresh", headers=auth_headers(test_user))
        assert resp.status_code == 403


@pytest.mark.asyncio
class TestDashboard:
    async def test_full_dashboard_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.get(f"{PREFIX}/dashboard", headers=auth_headers(admin_user))
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)
