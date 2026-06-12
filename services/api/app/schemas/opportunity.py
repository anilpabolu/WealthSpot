"""
Opportunity schemas (Pydantic v2).
"""

import uuid
from datetime import datetime
from typing import Any, Literal, Union

from pydantic import BaseModel, Field, field_validator

from app.models.opportunity import OpportunityStatus, VaultType
from app.services.s3 import ensure_current_public_url

# ---------------------------------------------------------------------------
# Property-type-specific specification schemas
# ---------------------------------------------------------------------------


class UnitConfiguration(BaseModel):
    """Individual BHK / unit configuration within a flat or villa project."""

    type: str  # "Studio" | "1 BHK" | "2 BHK" | "3 BHK" | "4 BHK" | "Penthouse"
    super_built_up_sqft: float | None = None
    built_up_sqft: float | None = None  # for villas / independent floors
    plot_area_sqyd: float | None = None  # villa/bungalow plot area
    car_parks: int | None = None
    floors: int | None = None  # for villas / duplex
    available_units: int | None = None
    price_per_sqft: float | None = None


class PlotConfiguration(BaseModel):
    """Individual plot variant (corner, east-facing, etc.)."""

    type: str  # "Corner Plot" | "Regular Plot" | "East-facing" | "North-facing"
    area_sqft: float
    area_sqyd: float | None = None
    area_guntha: float | None = None
    area_gunta: float | None = None  # alias used in Maharashtra/Telangana
    area_acre: float | None = None
    area_bigha: float | None = None  # North India
    available_plots: int | None = None
    total_plots: int | None = None
    price_per_sqft: float | None = None
    price_per_sqyd: float | None = None


class AreaConversions(BaseModel):
    """Pre-computed multi-unit area conversion for display."""

    sqft: float
    sqyd: float | None = None
    guntha: float | None = None
    gunta: float | None = None
    acre: float | None = None
    bigha: float | None = None
    hectare: float | None = None


class PropertySpecsFlat(BaseModel):
    """Flat / Apartment project specifications."""

    property_type: Literal["flat"] = "flat"
    configurations: list[UnitConfiguration] = []
    total_units_in_project: int | None = None
    total_floors: int | None = None
    total_towers: int | None = None
    land_parcel_area_sqft: float | None = None
    project_total_area_sqft: float | None = None
    possession_year: int | None = None
    launch_price_per_sqft: float | None = None
    current_price_per_sqft: float | None = None
    floor_plan_url: str | None = None


class PropertySpecsVilla(BaseModel):
    """Villa / Independent House project specifications."""

    property_type: Literal["villa"] = "villa"
    configurations: list[UnitConfiguration] = []
    total_units_in_project: int | None = None
    project_total_area_acres: float | None = None
    project_total_area_sqft: float | None = None
    land_parcel_area_sqft: float | None = None
    possession_year: int | None = None
    current_price_per_sqft: float | None = None


class PropertySpecsPlot(BaseModel):
    """Plot / Land Parcel project specifications."""

    property_type: Literal["plot"] = "plot"
    plot_configurations: list[PlotConfiguration] = []
    total_plots: int | None = None
    project_total_area_sqft: float | None = None
    project_total_area_acres: float | None = None
    project_total_area_guntha: float | None = None
    land_parcel_area_sqft: float | None = None
    dtcp_approved: bool = False
    facing_options: list[str] = []  # ["East", "North", "Corner"]
    conversion_display: AreaConversions | None = None


class PropertySpecsCommercial(BaseModel):
    """Commercial Office / Shop / Showroom project specifications."""

    property_type: Literal["commercial"] = "commercial"
    space_type: str | None = None  # "office" | "retail" | "showroom" | "mixed"
    configurations: list[UnitConfiguration] = []
    total_units_in_project: int | None = None
    car_parks_per_unit: int | None = None
    project_total_area_sqft: float | None = None
    current_price_per_sqft: float | None = None


class PropertySpecsWarehouse(BaseModel):
    """Warehouse / Industrial project specifications."""

    property_type: Literal["warehouse"] = "warehouse"
    total_area_sqft: float | None = None
    floor_height_ft: float | None = None
    loading_docks: int | None = None
    power_supply_kva: float | None = None
    project_total_area_sqft: float | None = None


class PropertySpecsMixedUse(BaseModel):
    """Mixed Use / Township project specifications."""

    property_type: Literal["mixed_use"] = "mixed_use"
    components: list[str] = []  # ["residential", "commercial", "retail"]
    residential_units: int | None = None
    commercial_units: int | None = None
    project_total_area_sqft: float | None = None


# Discriminated union — stored as JSONB, parsed by property_type key
PropertySpecs = Union[
    PropertySpecsFlat,
    PropertySpecsVilla,
    PropertySpecsPlot,
    PropertySpecsCommercial,
    PropertySpecsWarehouse,
    PropertySpecsMixedUse,
]


class MortgageAgreementSchema(BaseModel):
    enabled: bool = False
    details: str | None = None
    period_description: str | None = None


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

    @field_validator("avatar_url", mode="before")
    def rewrite_urls(cls, v):
        return ensure_current_public_url(v)


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

    @field_validator("url", mode="before")
    def rewrite_urls(cls, v):
        return ensure_current_public_url(v)


class CompanySummary(BaseModel):
    id: uuid.UUID
    company_name: str
    brand_name: str | None = None
    logo_url: str | None = None
    verified: bool = False
    entity_type: str | None = None
    website: str | None = None
    description: str | None = None
    city: str | None = None
    state: str | None = None
    years_in_business: int | None = None
    projects_completed: int = 0
    total_area_developed: str | None = None
    model_config = {"from_attributes": True}

    @field_validator("logo_url", mode="before")
    def rewrite_urls(cls, v):
        return ensure_current_public_url(v)


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


class ShieldDocumentOut(BaseModel):
    id: uuid.UUID
    filename: str | None = None
    content_type: str | None = None
    size_bytes: int | None = None
    url: str

    model_config = {"from_attributes": True}

    @field_validator("url", mode="before")
    def rewrite_url(cls, v):
        return ensure_current_public_url(v)


class ShieldAssessmentOut(BaseModel):
    id: uuid.UUID
    category_code: str
    subcategory_code: str
    status: str
    builder_answer: dict[str, Any] | None = None
    is_public: bool = True
    documents: list[ShieldDocumentOut] = []

    model_config = {"from_attributes": True}


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
    # Real-estate property specification fields
    property_type: str | None = None
    development_type: str | None = None
    gst_percentage: float | None = None
    holding_period_months: int | None = None
    projected_market_value_at_exit: float | None = None
    purpose_of_funds: str | None = None
    price_per_sqft: float | None = None
    total_project_area_sqft: float | None = None
    property_specs: dict[str, Any] | None = None
    property_amenities: list[str] | None = None
    cover_image: str | None = None
    video_url: str | None = None
    gallery: list[str] | None = None
    documents: dict | None = None
    company_id: uuid.UUID | None = None
    investor_count: int = 0
    launch_date: datetime | None = None
    funding_open_at: datetime | None = None
    closing_date: datetime | None = None
    # Investment configuration mode
    investment_mode: str | None = "lumpsum"
    project_roadmap: list[dict[str, Any]] | None = None
    risk_factors: str | None = None
    why_investors: str | None = None
    investment_thesis: str | None = None
    created_at: datetime
    updated_at: datetime
    creator: OpportunityCreatorRead | None = None
    media: list[OpportunityMediaRead] = []
    company: CompanySummary | None = None
    location_usps: list[dict] | None = None
    latitude: float | None = None
    longitude: float | None = None
    maps_url: str | None = None
    shield_assessments: list[ShieldAssessmentOut] = []

    model_config = {"from_attributes": True}

    @field_validator("cover_image", "video_url", mode="before")
    def rewrite_single_urls(cls, v):
        return ensure_current_public_url(v)

    @field_validator("gallery", mode="before")
    def rewrite_list_urls(cls, v):
        if v is None:
            return v
        return [ensure_current_public_url(url) for url in v]


class PaginatedOpportunities(BaseModel):
    items: list[OpportunityRead]
    total: int
    page: int
    page_size: int
    total_pages: int


class LocationUspSchema(BaseModel):
    text: str
    category: str


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
    # Geo-coordinates (Google Maps)
    latitude: float | None = None
    longitude: float | None = None
    maps_url: str | None = None
    # Location USPs
    location_usps: list[LocationUspSchema] | None = None
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
    # Real-estate property specification fields (Wealth + Safe vaults)
    property_type: str | None = None
    development_type: str | None = None
    gst_percentage: float | None = None
    holding_period_months: int | None = None
    projected_market_value_at_exit: float | None = None
    purpose_of_funds: str | None = None
    price_per_sqft: float | None = None
    total_project_area_sqft: float | None = None
    property_specs: dict[str, Any] | None = None
    property_amenities: list[str] | None = None
    # Combined amenity cost estimate (single ₹ figure, e.g. ₹50 000 per unit)
    amenity_cost_estimate: float | None = None
    # Funding schedule
    funding_open_at: datetime | None = None
    closing_date: datetime | None = None
    # Investment configuration mode: 'lumpsum' or 'unit_config'
    investment_mode: str | None = "lumpsum"
    shield_answers: dict[str, Any] | None = None
    project_roadmap: list[dict[str, Any]] | None = None
    risk_factors: str | None = None
    why_investors: str | None = None
    investment_thesis: str | None = None


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
    # Geo-coordinates (Google Maps)
    latitude: float | None = None
    longitude: float | None = None
    maps_url: str | None = None
    # Location USPs
    location_usps: list[LocationUspSchema] | None = None
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
    # Real-estate property specification fields (Wealth + Safe vaults)
    property_type: str | None = None
    development_type: str | None = None
    gst_percentage: float | None = None
    holding_period_months: int | None = None
    projected_market_value_at_exit: float | None = None
    purpose_of_funds: str | None = None
    price_per_sqft: float | None = None
    total_project_area_sqft: float | None = None
    property_specs: dict[str, Any] | None = None
    property_amenities: list[str] | None = None
    # Combined amenity cost estimate
    amenity_cost_estimate: float | None = None
    # Funding schedule
    funding_open_at: datetime | None = None
    closing_date: datetime | None = None
    status: str | None = None
    # Investment configuration mode: 'lumpsum' or 'unit_config'
    investment_mode: str | None = None
    shield_answers: dict[str, Any] | None = None
    project_roadmap: list[dict[str, Any]] | None = None
    risk_factors: str | None = None
    why_investors: str | None = None
    investment_thesis: str | None = None
    # Investment management (admin only)
    cancel_investments: bool = False


class VaultStatsResponse(BaseModel):
    """Aggregated statistics for a single vault type."""

    vault_type: str
    total_invested: float
    investor_count: int
    opportunity_count: int
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


# ── Opportunity form options (DB-driven dropdowns / chip selects) ────────────


class OpportunityFormOptionRead(BaseModel):
    id: uuid.UUID
    field_name: str
    value: str
    label: str
    is_active: bool
    sort_order: int
    model_config = {"from_attributes": True}


class OpportunityFormOptionsGrouped(BaseModel):
    community_type: list[OpportunityFormOptionRead] = []
    collaboration_type: list[OpportunityFormOptionRead] = []
    investment_tenure: list[OpportunityFormOptionRead] = []
    revenue_model: list[OpportunityFormOptionRead] = []
    legal_structure: list[OpportunityFormOptionRead] = []
    risk_level: list[OpportunityFormOptionRead] = []
    projected_timeline: list[OpportunityFormOptionRead] = []
    time_commitment: list[OpportunityFormOptionRead] = []
    partnership_duration: list[OpportunityFormOptionRead] = []
    partner_skill: list[OpportunityFormOptionRead] = []
    decision_authority: list[OpportunityFormOptionRead] = []
