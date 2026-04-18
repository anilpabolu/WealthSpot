"""
Tests for portfolio endpoints: /api/v1/portfolio/*
All endpoints require authenticated user.
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

PREFIX = "/api/v1/portfolio"


@pytest.mark.asyncio
class TestPortfolioAuth:
    async def test_summary_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/summary")
        assert resp.status_code == 401

    async def test_properties_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/properties")
        assert resp.status_code == 401

    async def test_transactions_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/transactions")
        assert resp.status_code == 401


@pytest.mark.asyncio
class TestPortfolioSummary:
    async def test_summary_ok(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/summary", headers=auth_headers(test_user))
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)

    async def test_summary_empty_for_new_user(self, client: AsyncClient, test_user: User):
        """New user with no investments should still get a valid response."""
        resp = await client.get(f"{PREFIX}/summary", headers=auth_headers(test_user))
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestPortfolioProperties:
    async def test_properties_ok(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/properties", headers=auth_headers(test_user))
        assert resp.status_code == 200
        # Should return a list (possibly empty)
        data = resp.json()
        assert isinstance(data, (list, dict))


@pytest.mark.asyncio
class TestPortfolioTransactions:
    async def test_transactions_ok(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/transactions", headers=auth_headers(test_user))
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestVaultWisePortfolio:
    async def test_vault_wise_unauthenticated(self, client: AsyncClient):
        resp = await client.get(f"{PREFIX}/vault-wise")
        assert resp.status_code == 401

    async def test_vault_wise_ok(self, client: AsyncClient, test_user: User):
        resp = await client.get(f"{PREFIX}/vault-wise", headers=auth_headers(test_user))
        assert resp.status_code == 200
