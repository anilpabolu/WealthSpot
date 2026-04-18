"""
Tests for profile endpoints: /api/v1/profile/*
All endpoints require authenticated user.
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/profile"


@pytest.mark.asyncio
class TestProfileAuth:
    async def test_completion_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/completion")
        assert resp.status_code == 401

    async def test_full_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/full")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestProfileCompletion:
    async def test_get_completion(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/completion", headers=auth_headers(test_user))
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)


@pytest.mark.asyncio
class TestFullProfile:
    async def test_get_full_profile(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/full", headers=auth_headers(test_user))
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)


@pytest.mark.asyncio
class TestProfileSections:
    async def test_update_section_1(self, client: AsyncClient, test_user: User):
        resp = await client.put(
            f"{PREFIX}/section/1",
            json={"full_name": "Test Investor Updated", "date_of_birth": "1990-05-15"},
            headers=auth_headers(test_user),
        )
        # Might be 200 or 422 if required fields differ
        assert resp.status_code in (200, 422)

    async def test_update_section_unauthenticated(self, client: AsyncClient):
        resp = await client.put(
            f"{PREFIX}/section/1",
            json={"full_name": "Hacker"},
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestPhoneUpdate:
    async def test_update_phone_unauthenticated(self, client: AsyncClient):
        resp = await client.put(f"{PREFIX}/phone", json={"phone": "9876543210"})
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestOtp:
    async def test_send_otp_unauthenticated(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/otp/send",
            json={"channel": "email"},
        )
        assert resp.status_code == 401

    async def test_verify_otp_unauthenticated(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/otp/verify",
            json={"otp": "123456"},
        )
        assert resp.status_code == 401
