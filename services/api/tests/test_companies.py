"""
Tests for company endpoints: /api/v1/companies/*
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/companies"


@pytest.mark.asyncio
class TestCompanyCreate:
    async def test_create_company_authenticated(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        resp = await client.post(
            PREFIX,
            json={
                "company_name": "Test Builders Pvt. Ltd.",
                "entity_type": "private_limited",
                "country": "India",
                "city": "Bengaluru",
                "state": "Karnataka",
            },
            headers=headers,
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["company_name"] == "Test Builders Pvt. Ltd."
        assert data["entity_type"] == "private_limited"

    async def test_create_company_unauthenticated(self, client: AsyncClient):
        resp = await client.post(
            PREFIX,
            json={
                "company_name": "Unauthenticated Corp",
                "entity_type": "private_limited",
                "country": "India",
            },
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestCompanyList:
    async def test_list_companies(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        # Create a company first
        await client.post(
            PREFIX,
            json={
                "company_name": "Listable Corp",
                "entity_type": "llp",
                "country": "India",
            },
            headers=headers,
        )
        # List
        resp = await client.get(PREFIX, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert data["total"] >= 1

    async def test_list_companies_with_search(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        await client.post(
            PREFIX,
            json={
                "company_name": "Searchable Builders",
                "entity_type": "private_limited",
                "country": "India",
            },
            headers=headers,
        )
        resp = await client.get(PREFIX, params={"search": "Searchable"}, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
