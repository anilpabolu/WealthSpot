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
    async def test_create_opportunity_authenticated_full(self, client: AsyncClient, test_user: User):
        """Test creating an opportunity with all complex fields (location_usps, shield_answers)."""
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
                "maps_url": "https://goo.gl/maps/example",
                "location_usps": [
                    {
                        "text": "5 km from Airport",
                        "category": "transport"
                    },
                    {
                        "text": "1 km from Metro Station",
                        "category": "transport"
                    }
                ],
                "shield_answers": {
                    "legal_due_diligence": "Yes, clear title.",
                    "rera_approved": "Yes, RERA-12345"
                }
            },
            headers=headers,
        )
        assert resp.status_code in (200, 201), f"Expected 200/201, got {resp.status_code}. Response: {resp.text}"
        data = resp.json()
        assert data["title"] == "Premium Villas at MG Road"
        assert data["vault_type"] == "wealth"
        assert data["maps_url"] == "https://goo.gl/maps/example"
        assert len(data["location_usps"]) == 2
        assert data["location_usps"][0]["text"] == "5 km from Airport"

    async def test_create_opportunity_invalid_company_id(self, client: AsyncClient, test_user: User):
        """Test negative scenario: Invalid company UUID format."""
        headers = auth_headers(test_user)
        resp = await client.post(
            PREFIX,
            json={
                "vault_type": "wealth",
                "title": "Invalid Company Opp",
                "company_id": "not-a-uuid"
            },
            headers=headers,
        )
        assert resp.status_code == 422
        data = resp.json()
        assert data["code"] == "INVALID_COMPANY_ID"

    async def test_create_opportunity_unauthenticated(self, client: AsyncClient):
        """Test negative scenario: Missing authentication."""
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
        resp_post = await client.post(
            PREFIX,
            json={
                "vault_type": "wealth",
                "title": "FinTech Startup Series A",
                "industry": "FinTech",
                "stage": "Series A",
            },
            headers=headers,
        )
        assert resp_post.status_code in (200, 201), f"Failed to create: {resp_post.text}"
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
                "community_subtype": "co_investor",
            },
            headers=headers,
        )
        resp = await client.get(
            PREFIX,
            params={"vault_type": "community"},
            headers=headers,
        )
        assert resp.status_code == 200


@pytest.mark.asyncio
class TestCommunitySubtype:
    """Tests for co-investor / co-partner community subtype feature."""

    async def test_create_community_requires_subtype(self, client: AsyncClient, test_user: User):
        """Community vault without community_subtype should return 422."""
        headers = auth_headers(test_user)
        resp = await client.post(
            PREFIX,
            json={
                "vault_type": "community",
                "title": "Missing Subtype",
                "community_type": "Sports Complex",
                "collaboration_type": "Capital Only",
            },
            headers=headers,
        )
        assert resp.status_code == 422

    async def test_create_community_invalid_subtype(self, client: AsyncClient, test_user: User):
        """Invalid community_subtype value should return 422."""
        headers = auth_headers(test_user)
        resp = await client.post(
            PREFIX,
            json={
                "vault_type": "community",
                "title": "Invalid Subtype",
                "community_type": "Sports Complex",
                "collaboration_type": "Capital Only",
                "community_subtype": "invalid_type",
            },
            headers=headers,
        )
        assert resp.status_code == 422

    async def test_create_co_investor_opportunity(self, client: AsyncClient, test_user: User):
        """Co-investor community opportunity should be created successfully."""
        headers = auth_headers(test_user)
        resp = await client.post(
            PREFIX,
            json={
                "vault_type": "community",
                "title": "Co-Investor Sports Complex",
                "community_type": "Sports Complex",
                "collaboration_type": "Capital Only",
                "community_subtype": "co_investor",
                "community_details": {
                    "maxInvestors": 20,
                    "expectedReturns": 12.5,
                    "investmentTenure": "3 Years",
                    "revenueModel": "Membership Fees",
                    "legalStructure": "LLP",
                    "riskLevel": "Moderate",
                    "projectedTimeline": "2 Years",
                },
                "target_amount": 10_000_000,
                "min_investment": 500_000,
            },
            headers=headers,
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["community_subtype"] == "co_investor"
        assert data["community_details"]["maxInvestors"] == 20

    async def test_create_co_partner_opportunity(self, client: AsyncClient, test_user: User):
        """Co-partner community opportunity should be created successfully."""
        headers = auth_headers(test_user)
        resp = await client.post(
            PREFIX,
            json={
                "vault_type": "community",
                "title": "Co-Partner Coworking Space",
                "community_type": "Co-working Space",
                "collaboration_type": "Full Collaboration",
                "community_subtype": "co_partner",
                "community_details": {
                    "capitalFromPartner": 500_000,
                    "equityShare": 25.0,
                    "requiredSkills": ["Operations", "Marketing & Sales"],
                    "timeCommitment": "Full-time (20–40 hrs/week)",
                    "partnershipDuration": "2 Years",
                    "partnerRole": "Operations Head",
                    "keyResponsibilities": "Day-to-day management of coworking space operations.",
                    "decisionAuthority": "Equal say",
                    "partnerBenefits": "25% equity, monthly stipend, co-branding rights",
                },
                "target_amount": 5_000_000,
            },
            headers=headers,
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data["community_subtype"] == "co_partner"
        assert "requiredSkills" in data["community_details"]

    async def test_filter_by_community_subtype(self, client: AsyncClient, test_user: User):
        """Should filter opportunities by community_subtype param."""
        headers = auth_headers(test_user)
        # Create one co_investor and one co_partner
        await client.post(
            PREFIX,
            json={
                "vault_type": "community",
                "title": "Filter Test Co-Investor",
                "community_type": "Local Business",
                "collaboration_type": "Capital Only",
                "community_subtype": "co_investor",
            },
            headers=headers,
        )
        await client.post(
            PREFIX,
            json={
                "vault_type": "community",
                "title": "Filter Test Co-Partner",
                "community_type": "Local Business",
                "collaboration_type": "Full Collaboration",
                "community_subtype": "co_partner",
            },
            headers=headers,
        )
        # Filter co_investor only
        resp = await client.get(
            PREFIX,
            params={"vault_type": "community", "community_subtype": "co_investor"},
            headers=headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        for item in data["items"]:
            assert item["community_subtype"] == "co_investor"

    async def test_wealth_vault_ignores_subtype(self, client: AsyncClient, test_user: User):
        """Non-community vaults should ignore community_subtype."""
        headers = auth_headers(test_user)
        resp = await client.post(
            PREFIX,
            json={
                "vault_type": "wealth",
                "title": "Wealth Ignores Subtype",
                "target_amount": 10_000_000,
            },
            headers=headers,
        )
        assert resp.status_code in (200, 201)
        data = resp.json()
        assert data.get("community_subtype") is None
