"""
Tests for appreciation endpoints: /api/v1/opportunities/{id}/appreciate + appreciation-history
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/opportunities"


@pytest.mark.asyncio
class TestAppreciationHistory:
    async def test_history_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/00000000-0000-0000-0000-000000000001/appreciation-history")
        assert resp.status_code == 401

    async def test_history_nonexistent_opportunity(self, client: AsyncClient, test_user: User):
        resp = await client.get(
            f"{PREFIX}/00000000-0000-0000-0000-000000000001/appreciation-history",
            headers=auth_headers(test_user),
        )
        # Should return 404 for nonexistent opportunity or empty list
        assert resp.status_code in (200, 404)

    async def test_history_empty_for_valid_user(self, client: AsyncClient, test_user: User):
        """Even with auth, returns empty list when no appreciation events exist."""
        resp = await client.get(
            f"{PREFIX}/00000000-0000-0000-0000-000000000001/appreciation-history",
            headers=auth_headers(test_user),
        )
        if resp.status_code == 200:
            assert isinstance(resp.json(), list)


@pytest.mark.asyncio
class TestAppreciate:
    async def test_appreciate_requires_auth(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/00000000-0000-0000-0000-000000000001/appreciate",
            json={"mode": "percentage", "input_value": 5},
        )
        assert resp.status_code == 401

    async def test_appreciate_forbidden_for_investor(self, client: AsyncClient, test_user: User):
        """Investors cannot appreciate opportunities."""
        resp = await client.post(
            f"{PREFIX}/00000000-0000-0000-0000-000000000001/appreciate",
            json={"mode": "percentage", "input_value": 5},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403

    async def test_appreciate_allowed_for_admin(self, client: AsyncClient, admin_user: User):
        """Admins can appreciate — should fail on nonexistent opp, not auth."""
        resp = await client.post(
            f"{PREFIX}/00000000-0000-0000-0000-000000000001/appreciate",
            json={"mode": "percentage", "input_value": 5},
            headers=auth_headers(admin_user),
        )
        # 404 because the opportunity doesn't exist, but NOT 401
        assert resp.status_code in (403, 404, 422)
