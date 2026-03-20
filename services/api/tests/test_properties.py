"""
Tests for property endpoints: /api/v1/properties/*
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/properties"


@pytest.mark.asyncio
class TestPropertyList:
    async def test_list_properties_public(self, client: AsyncClient):
        """Properties list should be accessible without auth."""
        resp = await client.get(PREFIX)
        assert resp.status_code == 200
        data = resp.json()
        assert "properties" in data

    async def test_list_properties_with_filters(self, client: AsyncClient):
        resp = await client.get(PREFIX, params={"city": "Bengaluru", "page": 1})
        assert resp.status_code == 200

    async def test_featured_properties(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/featured")
        assert resp.status_code == 200

    async def test_available_cities(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/cities")
        assert resp.status_code == 200
