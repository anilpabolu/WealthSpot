"""
Tests for upload endpoints: /api/v1/uploads/*
Most endpoints require S3; we test auth gating and the list endpoint.
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/uploads"


@pytest.mark.asyncio
class TestUploadAuth:
    async def test_upload_opportunity_media_requires_auth(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/opportunity/00000000-0000-0000-0000-000000000001/media",
            files={"files": ("test.jpg", b"\xff\xd8\xff", "image/jpeg")},
        )
        assert resp.status_code == 401

    async def test_upload_company_logo_requires_auth(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/company/00000000-0000-0000-0000-000000000001/logo",
            files={"file": ("logo.png", b"\x89PNG", "image/png")},
        )
        assert resp.status_code == 401

    async def test_delete_media_requires_admin(self, client: AsyncClient, test_user: User):
        resp = await client.delete(
            f"{PREFIX}/opportunity-media/00000000-0000-0000-0000-000000000001",
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403


@pytest.mark.asyncio
class TestAdminMediaList:
    async def test_admin_list_media_requires_admin(self, client: AsyncClient, test_user: User):
        resp = await client.get(
            f"{PREFIX}/admin/opportunity/00000000-0000-0000-0000-000000000001/media",
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403

    async def test_admin_list_media_ok(self, client: AsyncClient, admin_user: User):
        resp = await client.get(
            f"{PREFIX}/admin/opportunity/00000000-0000-0000-0000-000000000001/media",
            headers=auth_headers(admin_user),
        )
        # 200 with empty list or 404 for nonexistent opp
        assert resp.status_code in (200, 404)


@pytest.mark.asyncio
class TestMediaUpdate:
    async def test_update_media_requires_admin(self, client: AsyncClient, test_user: User):
        resp = await client.patch(
            f"{PREFIX}/opportunity-media/00000000-0000-0000-0000-000000000001",
            json={"label": "hero"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code == 403

    async def test_update_media_unauthenticated(self, client: AsyncClient):
        resp = await client.patch(
            f"{PREFIX}/opportunity-media/00000000-0000-0000-0000-000000000001",
            json={"label": "hero"},
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestCreatorMediaList:
    async def test_list_own_media_requires_auth(self, client: AsyncClient):
        resp = await client.get(
            f"{PREFIX}/opportunity/00000000-0000-0000-0000-000000000001/media"
        )
        assert resp.status_code == 401

    async def test_list_own_media_ok(self, client: AsyncClient, test_user: User):
        resp = await client.get(
            f"{PREFIX}/opportunity/00000000-0000-0000-0000-000000000001/media",
            headers=auth_headers(test_user),
        )
        # 200 empty or 403/404 if not creator
        assert resp.status_code in (200, 403, 404)
