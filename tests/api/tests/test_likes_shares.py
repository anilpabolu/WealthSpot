"""
Tests for like/share/referral endpoints: /api/v1/opportunities/{id}/like, share, referral-code
and user activities: /api/v1/opportunities/user/activities
"""

import uuid

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/opportunities"


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _create_opportunity(client: AsyncClient, headers: dict) -> dict:
    resp = await client.post(
        PREFIX,
        json={
            "vault_type": "wealth",
            "title": f"Like-Share Test {uuid.uuid4().hex[:6]}",
            "description": "Test property for like/share tests",
            "city": "Pune",
            "state": "Maharashtra",
            "target_amount": 5_000_000,
            "min_investment": 50_000,
            "target_irr": 12.0,
        },
        headers=headers,
    )
    assert resp.status_code in (200, 201), resp.text
    return resp.json()


# ── Like toggle ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestLikeToggle:
    """POST /opportunities/{id}/like – toggle like."""

    async def test_like_opportunity(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        resp = await client.post(f"{PREFIX}/{opp['id']}/like", headers=user_h)
        assert resp.status_code == 200
        data = resp.json()
        assert data["liked"] is True
        assert data["like_count"] >= 1

    async def test_unlike_opportunity(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        # Like first
        await client.post(f"{PREFIX}/{opp['id']}/like", headers=user_h)
        # Unlike
        resp = await client.post(f"{PREFIX}/{opp['id']}/like", headers=user_h)
        assert resp.status_code == 200
        assert resp.json()["liked"] is False

    async def test_like_requires_auth(self, client: AsyncClient, admin_user: User):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        resp = await client.post(f"{PREFIX}/{opp['id']}/like")
        assert resp.status_code == 401

    async def test_like_nonexistent_opportunity(
        self, client: AsyncClient, test_user: User
    ):
        user_h = auth_headers(test_user)
        resp = await client.post(
            f"{PREFIX}/{uuid.uuid4()}/like", headers=user_h
        )
        assert resp.status_code == 404


# ── Like status ──────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestLikeStatus:
    """GET /opportunities/{id}/like-status – check like state."""

    async def test_like_status_unauthenticated(
        self, client: AsyncClient, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        resp = await client.get(f"{PREFIX}/{opp['id']}/like-status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["liked"] is False
        assert data["like_count"] >= 0

    async def test_like_status_after_like(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        await client.post(f"{PREFIX}/{opp['id']}/like", headers=user_h)
        resp = await client.get(
            f"{PREFIX}/{opp['id']}/like-status", headers=user_h
        )
        assert resp.status_code == 200
        assert resp.json()["liked"] is True


# ── Share tracking ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestShareTracking:
    """POST /opportunities/{id}/share – record share event."""

    async def test_share_opportunity(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        resp = await client.post(f"{PREFIX}/{opp['id']}/share", headers=user_h)
        assert resp.status_code == 200
        data = resp.json()
        assert "property_referral_code" in data
        assert data["property_referral_code"].startswith("P")
        assert "referral_link" in data

    async def test_share_returns_same_code(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        r1 = await client.post(f"{PREFIX}/{opp['id']}/share", headers=user_h)
        r2 = await client.post(f"{PREFIX}/{opp['id']}/share", headers=user_h)
        assert r1.json()["property_referral_code"] == r2.json()["property_referral_code"]

    async def test_share_requires_auth(self, client: AsyncClient, admin_user: User):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        resp = await client.post(f"{PREFIX}/{opp['id']}/share")
        assert resp.status_code == 401

    async def test_share_nonexistent_opportunity(
        self, client: AsyncClient, test_user: User
    ):
        user_h = auth_headers(test_user)
        resp = await client.post(
            f"{PREFIX}/{uuid.uuid4()}/share", headers=user_h
        )
        assert resp.status_code == 404


# ── Property referral code ───────────────────────────────────────────────────


@pytest.mark.asyncio
class TestPropertyReferralCode:
    """GET /opportunities/{id}/referral-code – get or create referral code."""

    async def test_get_referral_code(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        resp = await client.get(
            f"{PREFIX}/{opp['id']}/referral-code", headers=user_h
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "code" in data
        assert data["code"].startswith("P")
        assert "referral_link" in data

    async def test_referral_code_idempotent(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        r1 = await client.get(
            f"{PREFIX}/{opp['id']}/referral-code", headers=user_h
        )
        r2 = await client.get(
            f"{PREFIX}/{opp['id']}/referral-code", headers=user_h
        )
        assert r1.json()["code"] == r2.json()["code"]

    async def test_different_users_get_different_codes(
        self, client: AsyncClient, test_user: User, builder_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)

        r1 = await client.get(
            f"{PREFIX}/{opp['id']}/referral-code",
            headers=auth_headers(test_user),
        )
        r2 = await client.get(
            f"{PREFIX}/{opp['id']}/referral-code",
            headers=auth_headers(builder_user),
        )
        assert r1.json()["code"] != r2.json()["code"]


# ── User activities feed ─────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestUserActivities:
    """GET /opportunities/user/activities – activity feed."""

    async def test_activities_empty(self, client: AsyncClient, test_user: User):
        user_h = auth_headers(test_user)
        resp = await client.get(
            f"{PREFIX}/user/activities", headers=user_h
        )
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_activities_after_like(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        await client.post(f"{PREFIX}/{opp['id']}/like", headers=user_h)
        resp = await client.get(
            f"{PREFIX}/user/activities", headers=user_h
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["activityType"] == "liked"

    async def test_activities_after_share(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        await client.post(f"{PREFIX}/{opp['id']}/share", headers=user_h)
        resp = await client.get(
            f"{PREFIX}/user/activities", headers=user_h
        )
        assert resp.status_code == 200
        data = resp.json()
        types = [a["activityType"] for a in data]
        assert "shared" in types

    async def test_activities_requires_auth(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/user/activities")
        assert resp.status_code == 401

    async def test_activities_limit(
        self, client: AsyncClient, test_user: User, admin_user: User
    ):
        admin_h = auth_headers(admin_user)
        opp = await _create_opportunity(client, admin_h)
        user_h = auth_headers(test_user)

        # Generate some activities
        for _ in range(5):
            await client.post(f"{PREFIX}/{opp['id']}/like", headers=user_h)

        resp = await client.get(
            f"{PREFIX}/user/activities",
            params={"limit": 2},
            headers=user_h,
        )
        assert resp.status_code == 200
        assert len(resp.json()) <= 2
