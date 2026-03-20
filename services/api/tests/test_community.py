"""
Tests for community endpoints: /api/v1/community/*
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/community"


@pytest.mark.asyncio
class TestCommunityPosts:
    async def test_list_posts(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        resp = await client.get(f"{PREFIX}/posts", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data

    async def test_create_post(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        resp = await client.post(
            f"{PREFIX}/posts",
            json={
                "title": "How to start investing in real estate?",
                "body": "I am completely new to real estate investing and would love to hear tips from experienced investors in this community",
                "post_type": "question",
            },
            headers=headers,
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["title"] == "How to start investing in real estate?"

    async def test_create_post_unauthenticated(self, client: AsyncClient):
        resp = await client.post(
            f"{PREFIX}/posts",
            json={
                "title": "Unauthenticated Post",
                "body": "Should fail",
                "post_type": "discussion",
            },
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestCommunityReplies:
    async def test_reply_to_post(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        # Create a post first
        post_resp = await client.post(
            f"{PREFIX}/posts",
            json={
                "title": "Test Post for Reply",
                "body": "This is a test post that needs replies so we can verify the community reply functionality works correctly",
                "post_type": "discussion",
            },
            headers=headers,
        )
        assert post_resp.status_code in (200, 201)
        post_id = post_resp.json()["id"]

        # Reply
        resp = await client.post(
            f"{PREFIX}/posts/{post_id}/replies",
            json={"body": "Great question! Here's my take..."},
            headers=headers,
        )
        assert resp.status_code in (200, 201)
