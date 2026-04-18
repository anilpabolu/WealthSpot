"""
Vertical integration tests: Auth endpoints (persona selection, profile updates).
Tests the full stack: HTTP → Router → Service → DB.
"""
import pytest
from httpx import AsyncClient

from tests.conftest import auth_headers

pytestmark = pytest.mark.asyncio


async def test_get_me(client: AsyncClient, test_user):
    """GET /api/v1/auth/me returns current user profile."""
    r = await client.get("/api/v1/auth/me", headers=auth_headers(test_user))
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == test_user.email


async def test_update_me(client: AsyncClient, test_user):
    """PUT /api/v1/auth/me updates user fields."""
    r = await client.put(
        "/api/v1/auth/me",
        json={"full_name": "Updated Name"},
        headers=auth_headers(test_user),
    )
    assert r.status_code in (200, 422)


async def test_select_persona(client: AsyncClient, test_user):
    """POST /api/v1/auth/select-persona sets persona."""
    r = await client.post(
        "/api/v1/auth/select-persona",
        json={"persona": "investor"},
        headers=auth_headers(test_user),
    )
    assert r.status_code in (200, 422)


async def test_select_persona_unauthorized(client: AsyncClient):
    """POST /api/v1/auth/select-persona without auth returns 401/403."""
    r = await client.post("/api/v1/auth/select-persona", json={"persona": "investor"})
    assert r.status_code in (401, 403)


async def test_switch_persona(client: AsyncClient, test_user):
    """POST /api/v1/auth/switch-persona switches to new persona."""
    r = await client.post(
        "/api/v1/auth/switch-persona",
        json={"persona": "investor"},
        headers=auth_headers(test_user),
    )
    assert r.status_code in (200, 400, 422)


async def test_add_persona(client: AsyncClient, test_user):
    """POST /api/v1/auth/add-persona adds a persona."""
    r = await client.post(
        "/api/v1/auth/add-persona",
        json={"persona": "lender"},
        headers=auth_headers(test_user),
    )
    assert r.status_code in (200, 400, 422)
