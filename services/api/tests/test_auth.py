"""
Tests for auth endpoints: /api/v1/auth/*
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers, refresh_token_for

PREFIX = "/api/v1/auth"


@pytest.mark.asyncio
class TestAuthCheck:
    async def test_check_existing_user(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/check", params={"email": test_user.email})
        assert resp.status_code == 200
        assert resp.json()["exists"] is True

    async def test_check_nonexistent_user(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/check", params={"email": "nobody@example.com"})
        assert resp.status_code == 200
        assert resp.json()["exists"] is False


@pytest.mark.asyncio
class TestAuthLogin:
    async def test_login_existing_user(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            f"{PREFIX}/login",
            json={"email": test_user.email, "full_name": test_user.full_name},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_login_nonexistent_user_returns_404(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/login",
            json={"email": "ghost@example.com", "full_name": "Ghost"},
        )
        assert resp.status_code == 404
        assert resp.json()["detail"] == "USER_NOT_REGISTERED"


@pytest.mark.asyncio
class TestAuthRegister:
    async def test_register_new_user(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/register",
            json={
                "email": "newuser@wealthspot.in",
                "full_name": "New User",
                "phone": "+919999888877",
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["email"] == "newuser@wealthspot.in"
        assert data["full_name"] == "New User"
        assert data["role"] == "investor"

    async def test_register_duplicate_email(self, client: AsyncClient, test_user: User):
        resp = await client.post(
            f"{PREFIX}/register",
            json={
                "email": test_user.email,
                "full_name": "Duplicate",
            },
        )
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()


@pytest.mark.asyncio
class TestAuthRefresh:
    async def test_refresh_valid_token(self, client: AsyncClient, test_user: User):
        refresh = refresh_token_for(test_user)
        resp = await client.post(
            f"{PREFIX}/refresh",
            json={"refresh_token": refresh},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_refresh_invalid_token(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/refresh",
            json={"refresh_token": "invalid.jwt.token"},
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestAuthMe:
    async def test_me_authenticated(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        resp = await client.get(f"{PREFIX}/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == test_user.email
        assert data["role"] == "investor"

    async def test_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/me")
        assert resp.status_code == 401

    async def test_me_invalid_token(self, client: AsyncClient):
        resp = await client.get(
            f"{PREFIX}/me",
            headers={"Authorization": "Bearer invalid.jwt.token"},
        )
        assert resp.status_code == 401
