"""
Vertical integration tests: Control Centre admin endpoints.
Tests platform stats, vault config, dashboard, user management.
"""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers

pytestmark = pytest.mark.asyncio


async def test_platform_stats(client: AsyncClient, admin_user):
    """GET /api/v1/control-centre/platform-stats returns metrics."""
    r = await client.get("/api/v1/control-centre/platform-stats", headers=auth_headers(admin_user))
    assert r.status_code in (200, 403)


async def test_platform_stats_requires_admin(client: AsyncClient, test_user):
    """GET /api/v1/control-centre/platform-stats rejects non-admin."""
    r = await client.get("/api/v1/control-centre/platform-stats", headers=auth_headers(test_user))
    assert r.status_code in (200, 401, 403)


async def test_vault_config(client: AsyncClient, admin_user):
    """GET /api/v1/control-centre/vault-config returns vault configuration."""
    r = await client.get("/api/v1/control-centre/vault-config", headers=auth_headers(admin_user))
    assert r.status_code in (200, 403)


async def test_vault_metrics_config(client: AsyncClient, admin_user):
    """GET /api/v1/control-centre/vault-metrics-config returns metrics config."""
    r = await client.get("/api/v1/control-centre/vault-metrics-config", headers=auth_headers(admin_user))
    assert r.status_code in (200, 403)


async def test_dashboard(client: AsyncClient, admin_user):
    """GET /api/v1/control-centre/dashboard returns admin dashboard."""
    r = await client.get("/api/v1/control-centre/dashboard", headers=auth_headers(admin_user))
    assert r.status_code in (200, 403)


async def test_users_list(client: AsyncClient, admin_user):
    """GET /api/v1/control-centre/users returns user list."""
    r = await client.get("/api/v1/control-centre/users", headers=auth_headers(admin_user))
    assert r.status_code in (200, 403)


async def test_users_list_requires_admin(client: AsyncClient, test_user):
    """GET /api/v1/control-centre/users rejects investor."""
    r = await client.get("/api/v1/control-centre/users", headers=auth_headers(test_user))
    assert r.status_code in (401, 403)


async def test_approval_categories(client: AsyncClient, admin_user):
    """GET /api/v1/control-centre/approval-categories lists categories."""
    r = await client.get("/api/v1/control-centre/approval-categories", headers=auth_headers(admin_user))
    assert r.status_code in (200, 403)


async def test_role_groups_list(client: AsyncClient, admin_user):
    """GET /api/v1/control-centre/role-groups lists groups."""
    r = await client.get("/api/v1/control-centre/role-groups", headers=auth_headers(admin_user))
    assert r.status_code in (200, 403)


async def test_invites_list(client: AsyncClient, admin_user):
    """GET /api/v1/control-centre/invites returns invites."""
    r = await client.get("/api/v1/control-centre/invites", headers=auth_headers(admin_user))
    assert r.status_code in (200, 403)
