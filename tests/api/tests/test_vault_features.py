"""
Tests for vault-features endpoints: /api/v1/vault-features/*
Matrix = admin, my-features = auth, stream = public.
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/vault-features"


@pytest.mark.asyncio
class TestFeatureMatrix:
    async def test_get_matrix_requires_admin(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/matrix", headers=auth_headers(test_user))
        assert resp.status_code == 403

    async def test_get_matrix_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.get(f"{PREFIX}/matrix", headers=auth_headers(admin_user))
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, (list, dict))

    async def test_update_matrix_requires_admin(self, client: AsyncClient, test_user: User):
        resp = await client.put(
            f"{PREFIX}/matrix",
            json={"features": []},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403

    async def test_update_matrix_unauthenticated(self, client: AsyncClient):
        resp = await client.put(f"{PREFIX}/matrix", json={"features": []})
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestMyFeatures:
    async def test_my_features_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/my-features")
        assert resp.status_code == 401

    async def test_my_features_ok(self, client: AsyncClient, test_user: User):
        resp = await client.get(
            f"{PREFIX}/my-features", headers=auth_headers(test_user)
        )
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)

    async def test_my_features_admin(self, client: AsyncClient, admin_user: User):
        resp = await client.get(
            f"{PREFIX}/my-features", headers=auth_headers(admin_user)
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestFeatureStream:
    async def test_stream_endpoint_rejects_bad_method(self, client: AsyncClient):
        """SSE stream is GET — verify POST is rejected."""
        resp = await client.post(f"{PREFIX}/stream")
        assert resp.status_code == 405
