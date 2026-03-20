"""
Tests for notification & points endpoints.
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers


@pytest.mark.asyncio
class TestNotifications:
    async def test_list_notifications(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        resp = await client.get("/api/v1/notifications", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data

    async def test_unread_count(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        resp = await client.get("/api/v1/notifications/unread-count", headers=headers)
        assert resp.status_code == 200

    async def test_notifications_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/v1/notifications")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestPoints:
    async def test_my_points(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        resp = await client.get("/api/v1/points/me", headers=headers)
        assert resp.status_code == 200

    async def test_leaderboard(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        resp = await client.get("/api/v1/points/leaderboard", headers=headers)
        assert resp.status_code == 200

    async def test_points_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/v1/points/me")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestHealth:
    async def test_health_endpoint(self, client: AsyncClient):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"

    async def test_root_endpoint(self, client: AsyncClient):
        resp = await client.get("/")
        assert resp.status_code == 200
