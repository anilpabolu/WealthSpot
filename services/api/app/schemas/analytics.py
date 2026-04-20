"""
Pydantic schemas for the Vault Analytics Dashboard.
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

# ── Vault Summary ────────────────────────────────────────────────────────────


class VaultSummaryItem(BaseModel):
    vault_type: str
    total_opportunities: int
    active_opportunities: int
    funding_opportunities: int
    funded_opportunities: int
    closed_opportunities: int
    total_target_amount: Decimal
    total_raised_amount: Decimal
    avg_target_irr: Decimal
    avg_expected_irr: Decimal
    avg_actual_irr: Decimal
    unique_creators: int
    total_investors: int
    funding_pct: Decimal = Decimal("0")

    model_config = {"from_attributes": True}


class VaultSummaryResponse(BaseModel):
    vaults: list[VaultSummaryItem]
    platform_aum: Decimal
    total_investors: int
    total_opportunities: int
    avg_deal_size: Decimal


# ── Investment Trends ────────────────────────────────────────────────────────


class MonthlyTrendPoint(BaseModel):
    month: str  # YYYY-MM
    vault_type: str
    investment_count: int
    total_amount: Decimal
    unique_investors: int

    model_config = {"from_attributes": True}


class InvestmentTrendsResponse(BaseModel):
    trends: list[MonthlyTrendPoint]
    total_volume: Decimal
    avg_monthly_volume: Decimal
    peak_month: str | None = None
    peak_amount: Decimal = Decimal("0")


# ── Geographic Distribution ──────────────────────────────────────────────────


class GeoCityItem(BaseModel):
    city: str
    state: str
    vault_type: str
    opportunity_count: int
    total_target: Decimal
    total_raised: Decimal
    total_investors: int

    model_config = {"from_attributes": True}


class GeoDistributionResponse(BaseModel):
    cities: list[GeoCityItem]
    top_city: str | None = None
    total_cities: int = 0


# ── Investor Analytics ───────────────────────────────────────────────────────


class InvestorGrowthPoint(BaseModel):
    month: str
    new_users: int
    new_investors: int
    new_builders: int
    kyc_approved: int
    kyc_in_progress: int
    cumulative_users: int = 0
    cumulative_investors: int = 0

    model_config = {"from_attributes": True}


class InvestorAnalyticsResponse(BaseModel):
    growth: list[InvestorGrowthPoint]
    total_users: int
    total_investors: int
    total_builders: int
    kyc_completion_rate: Decimal
    avg_monthly_signups: Decimal


# ── EOI Funnel ───────────────────────────────────────────────────────────────


class EOIFunnelItem(BaseModel):
    status: str
    vault_type: str
    eoi_count: int
    total_interest_amount: Decimal
    avg_interest_amount: Decimal

    model_config = {"from_attributes": True}


class EOIFunnelResponse(BaseModel):
    funnel: list[EOIFunnelItem]
    total_eois: int
    total_interest: Decimal
    conversion_rate: Decimal  # closed / submitted


# ── Top Opportunities ────────────────────────────────────────────────────────


class TopOpportunityItem(BaseModel):
    id: str
    title: str
    slug: str
    vault_type: str
    status: str
    city: str | None = None
    state: str | None = None
    target_amount: Decimal | None = None
    raised_amount: Decimal = Decimal("0")
    target_irr: Decimal | None = None
    expected_irr: Decimal | None = None
    actual_irr: Decimal | None = None
    investor_count: int = 0
    funding_pct: Decimal = Decimal("0")
    company_name: str | None = None
    creator_name: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TopOpportunitiesResponse(BaseModel):
    opportunities: list[TopOpportunityItem]
    total: int


# ── Transaction Revenue ──────────────────────────────────────────────────────


class TransactionRevenueItem(BaseModel):
    month: str
    txn_type: str
    txn_count: int
    total_amount: Decimal

    model_config = {"from_attributes": True}


class RevenueBreakdownResponse(BaseModel):
    monthly: list[TransactionRevenueItem]
    by_type: dict[str, Decimal]
    total_revenue: Decimal


# ── Full Analytics (convenience endpoint) ────────────────────────────────────


class FullAnalyticsResponse(BaseModel):
    vault_summary: VaultSummaryResponse
    investment_trends: InvestmentTrendsResponse
    geographic: GeoDistributionResponse
    investors: InvestorAnalyticsResponse
    eoi_funnel: EOIFunnelResponse
    top_opportunities: TopOpportunitiesResponse
    revenue: RevenueBreakdownResponse
