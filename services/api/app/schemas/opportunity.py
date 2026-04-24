"""
Opportunity schemas (Pydantic v2).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.opportunity import OpportunityStatus, VaultType


class MortgageAgreementSchema(BaseModel):
    enabled: bool = False
    details: str | None = None
    period_description: str | None = None


class ReraRegistrationSchema(BaseModel):
    enabled: bool = False
    rera_number: str | None = None


class BuybackGuaranteeSchema(BaseModel):
    enabled: bool = False
    details: str | None = None


class LandRegistrationSchema(BaseModel):
    enabled: bool = False
    details: str | None = None


class SafeVaultDataSchema(BaseModel):
    """Per-project Safe Vault configuration."""

    interest_rate: float = 0.0  # % per annum
    payout_frequency: str = "monthly"  # monthly | quarterly | yearly
    tenure_months: int | None = None
    mortgage_agreement: MortgageAgreementSchema = MortgageAgreementSchema()
    legal_notarised_doc: bool = False
    rera_registration: ReraRegistrationSchema = ReraRegistrationSchema()
    buyback_guarantee: BuybackGuaranteeSchema = BuybackGuaranteeSchema()
    capital_protection: bool = False
    collateral_details: str | None = None
    land_registration: LandRegistrationSchema = LandRegistrationSchema()


class OpportunityCreatorRead(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    avatar_url: str | None = None
    model_config = {"from_attributes": True}


class OpportunityMediaRead(BaseModel):
    id: uuid.UUID
    media_type: str
    s3_key: str
    url: str
    filename: str | None = None
    size_bytes: int | None = None
    content_type: str | None = None
    sort_order: int = 0
    is_cover: bool = False
    created_at: datetime
    model_config = {"from_attributes": True}


class CompanySummary(BaseModel):
    id: uuid.UUID
    company_name: str
    brand_name: str | None = None
    logo_url: str | None = None
    verified: bool = False
    entity_type: str | None = None
    rera_number: str | None = None
    website: str | None = None
    description: str | None = None
    city: str | None = None
    state: str | None = None
    years_in_business: int | None = None
    projects_completed: int = 0
    total_area_developed: str | None = None
    model_config = {"from_attributes": True}


class AddressDetail(BaseModel):
    address_line1: str | None = None
    address_line2: str | None = None
    landmark: str | None = None
    locality: str | None = None
    city: str | None = None
    district: str | None = None
    state: str | None = None
    pincode: str | None = None
    country: str = "India"


class OpportunityRead(BaseModel):
    id: uuid.UUID
    creator_id: uuid.UUID
    vault_type: VaultType
    status: OpportunityStatus
    approval_id: uuid.UUID | None = None
    title: str
    slug: str
    tagline: str | None = None
    description: str | None = None
    city: str | None = None
    state: str | None = None
    address: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    landmark: str | None = None
    locality: str | None = None
    pincode: str | None = None
    district: str | None = None
    country: str = "India"
    target_amount: float | None = None
    raised_amount: float = 0
    min_investment: float | None = None
    target_irr: float | None = None
    expected_irr: float | None = None
    actual_irr: float | None = None
    industry: str | None = None
    stage: str | None = None
    founder_name: str | None = None
    pitch_deck_url: str | None = None
    community_type: str | None = None
    collaboration_type: str | None = None
    community_subtype: str | None = None
    community_details: dict | None = None
    safe_vault_data: SafeVaultDataSchema | None = None
    project_phase: str | None = None
    current_valuation: float | None = None
    cover_image: str | None = None
    video_url: str | None = None
    gallery: list[str] | None = None
    documents: dict | None = None
    company_id: uuid.UUID | None = None
    investor_count: int = 0
    launch_date: datetime | None = None
    funding_open_at: datetime | None = None
    closing_date: datetime | None = None
    created_at: datetime
    updated_at: datetime
    creator: OpportunityCreatorRead | None = None
    media: list[OpportunityMediaRead] = []
    company: CompanySummary | None = None

    model_config = {"from_attributes": True}


class PaginatedOpportunities(BaseModel):
    items: list[OpportunityRead]
    total: int
    page: int
    page_size: int
    total_pages: int


class OpportunityCreateRequest(BaseModel):
    """Unified create request — fields depend on vault_type."""

    vault_type: VaultType
    title: str = Field(min_length=3, max_length=255)
    tagline: str | None = Field(None, max_length=500)
    description: str | None = None
    company_id: str | None = None
    # Address
    address_line1: str | None = None
    address_line2: str | None = None
    landmark: str | None = None
    locality: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    district: str | None = None
    country: str = "India"
    # Wealth / common fields
    address: str | None = None
    target_amount: float | None = None
    min_investment: float | None = None
    target_irr: float | None = None
    # Startup fields
    industry: str | None = None
    stage: str | None = None
    founder_name: str | None = None
    pitch_deck_url: str | None = None
    # Community fields
    community_type: str | None = None
    collaboration_type: str | None = None
    community_subtype: str | None = None
    community_details: dict | None = None
    # Safe Vault fields
    safe_vault_data: SafeVaultDataSchema | None = None
    project_phase: str | None = None
    # Funding schedule
    funding_open_at: datetime | None = None
    closing_date: datetime | None = None


class OpportunityUpdateRequest(BaseModel):
    """Update request — all fields optional (approver edit)."""

    title: str | None = Field(None, min_length=3, max_length=255)
    tagline: str | None = Field(None, max_length=500)
    description: str | None = None
    company_id: str | None = None
    # Address
    address_line1: str | None = None
    address_line2: str | None = None
    landmark: str | None = None
    locality: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    district: str | None = None
    country: str | None = None
    address: str | None = None
    # Financials
    target_amount: float | None = None
    min_investment: float | None = None
    target_irr: float | None = None
    # Startup fields
    industry: str | None = None
    stage: str | None = None
    founder_name: str | None = None
    pitch_deck_url: str | None = None
    # Community fields
    community_type: str | None = None
    collaboration_type: str | None = None
    community_subtype: str | None = None
    community_details: dict | None = None
    # Safe Vault fields
    safe_vault_data: SafeVaultDataSchema | None = None
    # Lifecycle
    project_phase: str | None = None
    # Funding schedule
    funding_open_at: datetime | None = None
    closing_date: datetime | None = None
    status: str | None = None
    # Investment management (admin only)
    cancel_investments: bool = False


class VaultStatsResponse(BaseModel):
    """Aggregated statistics for a single vault type."""

    vault_type: str
    total_invested: float
    investor_count: int
    opportunity_count: int
    expected_irr: float | None = None
    actual_irr: float | None = None
    explorer_count: int = 0
    dna_investor_count: int = 0
    min_investment: float | None = None
    avg_ticket_size: float | None = None
    cities_covered: int = 0
    sectors_covered: int = 0
    co_investor_count: int = 0
    co_partner_count: int = 0
    platform_users_count: int = 0
    # Safe Vault specific
    listings_count: int = 0
    avg_interest_rate: float | None = None
    avg_tenure_months: float | None = None
    mortgage_coverage_pct: float | None = None
    # Community specific
    avg_project_size: float | None = None
    collaboration_rate: float | None = None


# ── Builder investor / analytics schemas ────────────────────────────────────


class BuilderInvestorItem(BaseModel):
    investment_id: uuid.UUID
    investor_id: uuid.UUID
    investor_name: str
    investor_email: str
    investor_avatar: str | None = None
    opportunity_id: uuid.UUID
    opportunity_title: str
    opportunity_slug: str
    amount: float
    invested_at: datetime
    status: str


class BuilderInvestorsResponse(BaseModel):
    investors: list[BuilderInvestorItem]
    total_investors: int
    total_invested: float


class BuilderOpportunityBreakdown(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    status: str
    vault_type: str
    city: str | None = None
    raised_amount: float = 0
    target_amount: float = 0
    investor_count: int = 0
    funding_pct: float = 0
    created_at: datetime


class BuilderMonthlyTrend(BaseModel):
    month: str
    amount: float
    count: int


class BuilderCityDistribution(BaseModel):
    city: str
    count: int
    total_raised: float


class BuilderAnalyticsResponse(BaseModel):
    total_raised: float
    total_target: float
    investor_count: int
    opportunity_count: int
    opportunities: list[BuilderOpportunityBreakdown]
    monthly_trends: list[BuilderMonthlyTrend]
    city_distribution: list[BuilderCityDistribution]
    avg_days_to_fund: float | None = None
    top_opportunity: BuilderOpportunityBreakdown | None = None
    repeat_investor_rate: float = 0
