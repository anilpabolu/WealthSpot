"""
Tests for opportunity endpoints: /api/v1/opportunities/*
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/opportunities"


@pytest.mark.asyncio
class TestOpportunityCreate:
    async def test_create_opportunity_authenticated(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        resp = await client.post(
            PREFIX,
            json={
                "vault_type": "wealth",
                "title": "Premium Villas at MG Road",
                "tagline": "Luxury living meets smart investing",
                "description": "A premium gated community project.",
                "city": "Bengaluru",
                "state": "Karnataka",
                "target_amount": 50_000_000,
                "min_investment": 500_000,
                "target_irr": 18.5,
            },
            headers=headers,
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["title"] == "Premium Villas at MG Road"
        assert data["vault_type"] == "wealth"

    async def test_create_opportunity_unauthenticated(self, client: AsyncClient):
        resp = await client.post(
            PREFIX,
            json={
                "vault_type": "wealth",
                "title": "Unauthenticated Opportunity",
            },
        )
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestOpportunityList:
    async def test_list_opportunities(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        # Create one first
        await client.post(
            PREFIX,
            json={
                "vault_type": "opportunity",
                "title": "FinTech Startup Series A",
                "industry": "FinTech",
                "stage": "Series A",
            },
            headers=headers,
        )
        resp = await client.get(PREFIX, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert data["total"] >= 1

    async def test_list_opportunities_by_vault_type(self, client: AsyncClient, test_user: User):
        headers = auth_headers(test_user)
        await client.post(
            PREFIX,
            json={
                "vault_type": "community",
                "title": "Community Sports Complex",
                "community_type": "Sports Complex",
                "collaboration_type": "Full Collaboration",
            },
            headers=headers,
        )
        resp = await client.get(
            PREFIX,
            params={"vault_type": "community"},
            headers=headers,
        )
        assert resp.status_code == 200
