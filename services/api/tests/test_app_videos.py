"""
Tests for app-videos endpoints: /api/v1/app-videos/*
Covers public listing, public by tag, pages metadata, admin CRUD, upload.
"""

import uuid

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/app-videos"


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _create_video(client: AsyncClient, headers: dict, **overrides) -> dict:
    payload = {
        "page": "vaults",
        "section_tag": "hero",
        "title": "Intro Video",
        "description": "Platform introduction video",
        "video_url": "https://example.com/video.mp4",
        "thumbnail_url": "https://example.com/thumb.jpg",
        "is_active": True,
        "sort_order": 0,
    }
    payload.update(overrides)
    resp = await client.post(f"{PREFIX}/admin", json=payload, headers=headers)
    assert resp.status_code in (200, 201), resp.text
    return resp.json()


# ── Public endpoints ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestPublicVideos:
    """GET /app-videos/public – public listing."""

    async def test_list_active_videos_empty(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/public")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_list_active_videos_with_data(
        self, client: AsyncClient, admin_user: User
    ):
        headers = auth_headers(admin_user)
        await _create_video(client, headers, page="marketplace", section_tag="banner")
        resp = await client.get(f"{PREFIX}/public")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1

    async def test_filter_by_page(self, client: AsyncClient, admin_user: User):
        headers = auth_headers(admin_user)
        await _create_video(client, headers, page="vaults", section_tag="s1")
        await _create_video(client, headers, page="marketplace", section_tag="s2")
        resp = await client.get(f"{PREFIX}/public", params={"page": "vaults"})
        assert resp.status_code == 200
        data = resp.json()
        assert all(v["page"] == "vaults" for v in data)

    async def test_inactive_video_hidden_from_public(
        self, client: AsyncClient, admin_user: User
    ):
        headers = auth_headers(admin_user)
        vid = await _create_video(
            client, headers, page="hidden", section_tag="x", is_active=False
        )
        resp = await client.get(f"{PREFIX}/public", params={"page": "hidden"})
        assert resp.status_code == 200
        ids = [v["id"] for v in resp.json()]
        assert vid["id"] not in ids


@pytest.mark.asyncio
class TestPublicVideoByTag:
    """GET /app-videos/public/{page}/{section_tag} – single video."""

    async def test_found(self, client: AsyncClient, admin_user: User):
        headers = auth_headers(admin_user)
        await _create_video(client, headers, page="detail", section_tag="intro")
        resp = await client.get(f"{PREFIX}/public/detail/intro")
        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == "detail"
        assert data["section_tag"] == "intro"

    async def test_not_found(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/public/nonexistent/tag")
        assert resp.status_code == 404


# ── Pages metadata ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestVideoPages:
    """GET /app-videos/pages – admin dropdown metadata."""

    async def test_requires_auth(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/pages")
        assert resp.status_code == 401

    async def test_returns_pages_and_sections(
        self, client: AsyncClient, admin_user: User
    ):
        headers = auth_headers(admin_user)
        resp = await client.get(f"{PREFIX}/pages", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "pages" in data
        assert "sections" in data


# ── Admin CRUD ───────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestAdminVideoCRUD:
    """POST / GET / PATCH / DELETE on /app-videos/admin."""

    async def test_create_video(self, client: AsyncClient, admin_user: User):
        headers = auth_headers(admin_user)
        vid = await _create_video(client, headers)
        assert vid["title"] == "Intro Video"
        assert "id" in vid

    async def test_list_admin_videos(self, client: AsyncClient, admin_user: User):
        headers = auth_headers(admin_user)
        await _create_video(client, headers, section_tag="list-test")
        resp = await client.get(f"{PREFIX}/admin", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    async def test_update_video(self, client: AsyncClient, admin_user: User):
        headers = auth_headers(admin_user)
        vid = await _create_video(client, headers, section_tag="upd")
        resp = await client.patch(
            f"{PREFIX}/admin/{vid['id']}",
            json={"title": "Updated Title"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"

    async def test_update_nonexistent(self, client: AsyncClient, admin_user: User):
        headers = auth_headers(admin_user)
        fake_id = str(uuid.uuid4())
        resp = await client.patch(
            f"{PREFIX}/admin/{fake_id}",
            json={"title": "Nope"},
            headers=headers,
        )
        assert resp.status_code == 404

    async def test_delete_video(self, client: AsyncClient, admin_user: User):
        headers = auth_headers(admin_user)
        vid = await _create_video(client, headers, section_tag="del")
        resp = await client.delete(
            f"{PREFIX}/admin/{vid['id']}", headers=headers
        )
        assert resp.status_code == 200
        assert resp.json()["deleted"] is True

    async def test_delete_nonexistent(self, client: AsyncClient, admin_user: User):
        headers = auth_headers(admin_user)
        fake_id = str(uuid.uuid4())
        resp = await client.delete(
            f"{PREFIX}/admin/{fake_id}", headers=headers
        )
        assert resp.status_code == 404

    async def test_admin_requires_auth(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/admin")
        assert resp.status_code == 401


# ── Upload ───────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestAdminVideoUpload:
    """POST /app-videos/admin/{video_id}/upload – file upload."""

    async def test_upload_nonexistent_video(
        self, client: AsyncClient, admin_user: User
    ):
        headers = auth_headers(admin_user)
        fake_id = str(uuid.uuid4())
        resp = await client.post(
            f"{PREFIX}/admin/{fake_id}/upload",
            files={"file": ("test.mp4", b"fakevideo", "video/mp4")},
            headers=headers,
        )
        assert resp.status_code == 404

    async def test_upload_invalid_content_type(
        self, client: AsyncClient, admin_user: User
    ):
        headers = auth_headers(admin_user)
        vid = await _create_video(client, headers, section_tag="upl-bad")
        resp = await client.post(
            f"{PREFIX}/admin/{vid['id']}/upload",
            files={"file": ("test.txt", b"not a video", "text/plain")},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "Unsupported" in resp.json()["detail"]
