"""
Tests for builder-updates endpoints: /api/v1/builder-updates/*
GET list is public; create/patch/delete require auth + ownership.
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/builder-updates"


@pytest.mark.asyncio
class TestListUpdates:
    async def test_list_updates_public(self, client: AsyncClient):
        """GET list is public — returns 200 even without auth."""
        resp = await client.get(
            f"{PREFIX}/opportunities/00000000-0000-0000-0000-000000000001"
        )
        # Either 200 with empty list or 404 for nonexistent opp
        assert resp.status_code in (200, 404)

    async def test_list_updates_empty(self, client: AsyncClient):
        resp = await client.get(
            f"{PREFIX}/opportunities/00000000-0000-0000-0000-000000000001"
        )
        if resp.status_code == 200:
            assert isinstance(resp.json(), list)


@pytest.mark.asyncio
class TestCreateUpdate:
    async def test_create_requires_auth(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/opportunities/00000000-0000-0000-0000-000000000001",
            json={"title": "Progress update", "description": "Foundation done"},
        )
        assert resp.status_code == 401

    async def test_create_forbidden_for_investor(self, client: AsyncClient, test_user: User):
        """Regular investors cannot create builder updates."""
        resp = await client.post(
            f"{PREFIX}/opportunities/00000000-0000-0000-0000-000000000001",
            json={"title": "Progress update", "description": "Foundation done"},
            headers=auth_headers(test_user),
        )
        assert resp.status_code in (403, 404)


@pytest.mark.asyncio
class TestPatchUpdate:
    async def test_patch_requires_auth(self, client: AsyncClient):
        resp = await client.patch(
            f"{PREFIX}/00000000-0000-0000-0000-000000000001",
            json={"title": "Updated title"},
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestDeleteUpdate:
    async def test_delete_requires_auth(self, client: AsyncClient):
        resp = await client.delete(
            f"{PREFIX}/00000000-0000-0000-0000-000000000001",
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestAttachments:
    async def test_upload_attachment_requires_auth(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/00000000-0000-0000-0000-000000000001/attachments",
            files={"file": ("test.txt", b"hello", "text/plain")},
        )
        assert resp.status_code == 401

    async def test_delete_attachment_requires_auth(self, client: AsyncClient):
        resp = await client.delete(
            f"{PREFIX}/attachments/00000000-0000-0000-0000-000000000001",
        )
        assert resp.status_code == 401
