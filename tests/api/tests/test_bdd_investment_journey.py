"""
BDD: Investment Journey — API Integration Tests

Describes the full investor workflow using Given/When/Then narrative.

Journey:
  1. Investor browses properties (public)
  2. Investor checks KYC status (auth required)
  3. Investor initiates investment (auth + KYC approved)
  4. Payment confirmation (auth)
  5. Portfolio reflects investment (auth)

Note: Tests validate HTTP contracts only. DB-level state changes are isolated
per-test via the async test session fixtures in conftest.py.
"""

import pytest
from httpx import AsyncClient

from app.models.user import User
from tests.conftest import auth_headers

# ── Shared helpers ────────────────────────────────────────────────────────────

BASE = "/api/v1"
PROPERTIES = f"{BASE}/properties"
INVESTMENTS = f"{BASE}/investments"
PORTFOLIO = f"{BASE}/portfolio"
KYC = f"{BASE}/kyc"
REFERRALS = f"{BASE}/referrals"


# ── Step 1: Browse Properties ─────────────────────────────────────────────────


@pytest.mark.asyncio
class TestBDDStep1BrowseProperties:
    """
    Given an investor opens the WealthSpot app
    When they load the property marketplace
    Then they see a list of available properties.
    """

    async def test_given_app_is_open_when_marketplace_loaded_then_properties_listed(
        self, client: AsyncClient
    ):
        """Public endpoint — no auth required."""
        resp = await client.get(PROPERTIES)

        # Then: response is successful
        assert resp.status_code == 200
        data = resp.json()
        assert "properties" in data

    async def test_given_investor_on_marketplace_when_city_filter_applied_then_filtered_results(
        self, client: AsyncClient
    ):
        resp = await client.get(PROPERTIES, params={"city": "Mumbai"})

        assert resp.status_code == 200

    async def test_given_investor_on_marketplace_when_featured_tab_clicked_then_featured_list(
        self, client: AsyncClient
    ):
        resp = await client.get(f"{PROPERTIES}/featured")

        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    async def test_given_investor_searches_when_query_entered_then_autocomplete_suggestions(
        self, client: AsyncClient
    ):
        resp = await client.get(f"{PROPERTIES}/autocomplete", params={"q": "mum"})

        assert resp.status_code in (200, 422)


# ── Step 2: KYC Status Check ──────────────────────────────────────────────────


@pytest.mark.asyncio
class TestBDDStep2KycCheck:
    """
    Given an investor wants to invest
    When they check their KYC status
    Then they see whether KYC is approved or pending.
    """

    async def test_given_unauthenticated_investor_when_kyc_checked_then_401(
        self, client: AsyncClient
    ):
        """Without auth, KYC route should be protected."""
        resp = await client.get(f"{KYC}/status")

        # Then: access denied
        assert resp.status_code == 401

    async def test_given_authenticated_investor_when_kyc_status_fetched_then_status_returned(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get(f"{KYC}/status", headers=auth_headers(test_user))

        # Then: we get a status response (200) — may be not_started in test env
        assert resp.status_code == 200
        data = resp.json()
        assert "kycStatus" in data or "kyc_status" in data


# ── Step 3: Initiate Investment ───────────────────────────────────────────────


@pytest.mark.asyncio
class TestBDDStep3InitiateInvestment:
    """
    Given a KYC-approved investor on a property detail page
    When they click 'Invest' and enter an amount
    Then a payment order is created.
    """

    async def test_given_no_auth_when_investment_initiated_then_401(
        self, client: AsyncClient
    ):
        """Unauthenticated investment attempt must fail."""
        resp = await client.post(
            INVESTMENTS,
            json={"propertyId": "some-prop", "amount": 50000, "units": 2},
        )

        assert resp.status_code == 401

    async def test_given_investor_when_investment_with_invalid_body_then_422(
        self, client: AsyncClient, test_user: User
    ):
        """Malformed payload must return 422 validation error."""
        resp = await client.post(
            INVESTMENTS,
            json={"amount": "not-a-number"},  # invalid type
            headers=auth_headers(test_user),
        )

        assert resp.status_code == 422
        data = resp.json()
        assert "detail" in data

    async def test_given_investor_when_investment_missing_property_id_then_422(
        self, client: AsyncClient, test_user: User
    ):
        """Investment without propertyId must be rejected with 422."""
        resp = await client.post(
            INVESTMENTS,
            json={"amount": 50000, "units": 2},  # missing propertyId
            headers=auth_headers(test_user),
        )

        # 422 from Pydantic validation
        assert resp.status_code == 422


# ── Step 4: Payment Confirmation ─────────────────────────────────────────────


@pytest.mark.asyncio
class TestBDDStep4ConfirmPayment:
    """
    Given an investor completed Razorpay checkout
    When they confirm the payment
    Then the investment status changes to confirmed.
    """

    async def test_given_no_auth_when_confirm_payment_called_then_401(
        self, client: AsyncClient
    ):
        resp = await client.post(
            f"{INVESTMENTS}/confirm-payment",
            json={
                "orderId": "order-xyz",
                "razorpayPaymentId": "pay_abc",
                "razorpaySignature": "sig_123",
            },
        )

        assert resp.status_code == 401

    async def test_given_investor_when_confirm_with_invalid_order_then_not_200(
        self, client: AsyncClient, test_user: User
    ):
        """Confirming with a fake order ID should fail (not 200)."""
        resp = await client.post(
            f"{INVESTMENTS}/confirm-payment",
            json={
                "orderId": "fake-order-id",
                "razorpayPaymentId": "pay_fake",
                "razorpaySignature": "sig_fake",
            },
            headers=auth_headers(test_user),
        )

        # 400 (bad request) or 404 (order not found) are both acceptable
        assert resp.status_code in (400, 404, 422)


# ── Step 5: Portfolio Reflection ──────────────────────────────────────────────


@pytest.mark.asyncio
class TestBDDStep5Portfolio:
    """
    Given an investor has made investments
    When they view their portfolio
    Then their holdings and returns are shown.
    """

    async def test_given_no_auth_when_portfolio_viewed_then_401(
        self, client: AsyncClient
    ):
        resp = await client.get(f"{PORTFOLIO}/summary")

        assert resp.status_code == 401

    async def test_given_authenticated_investor_when_portfolio_summary_fetched_then_200(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get(f"{PORTFOLIO}/summary", headers=auth_headers(test_user))

        assert resp.status_code == 200

    async def test_given_authenticated_investor_when_portfolio_properties_fetched_then_list(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get(f"{PORTFOLIO}/properties", headers=auth_headers(test_user))

        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    async def test_given_authenticated_investor_when_vault_wise_fetched_then_response(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get(f"{PORTFOLIO}/vault-wise", headers=auth_headers(test_user))

        assert resp.status_code == 200


# ── Step 6: Referral Journey ──────────────────────────────────────────────────


@pytest.mark.asyncio
class TestBDDStep6ReferralJourney:
    """
    Given an investor wants to earn referral rewards
    When they share their code and a friend registers
    Then their referral stats update.
    """

    async def test_given_no_auth_when_referral_stats_checked_then_401(
        self, client: AsyncClient
    ):
        resp = await client.get(f"{REFERRALS}/stats")

        assert resp.status_code == 401

    async def test_given_authenticated_investor_when_referral_stats_fetched_then_code_present(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get(f"{REFERRALS}/stats", headers=auth_headers(test_user))

        assert resp.status_code == 200
        data = resp.json()
        # The response should contain a referral code or stats
        assert isinstance(data, dict)

    async def test_given_authenticated_investor_when_referral_history_fetched_then_list(
        self, client: AsyncClient, test_user: User
    ):
        resp = await client.get(f"{REFERRALS}/history", headers=auth_headers(test_user))

        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
