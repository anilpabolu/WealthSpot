"""
Opportunity schemas (Pydantic v2).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.opportunity import VaultType, OpportunityStatus


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
    cover_image: str | None = None
    video_url: str | None = None
    gallery: list[str] | None = None
    documents: dict | None = None
    company_id: uuid.UUID | None = None
    investor_count: int = 0
    launch_date: datetime | None = None
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
    # Lifecycle
    closing_date: datetime | None = None
    status: str | None = None


class VaultStatsResponse(BaseModel):
    """Aggregated statistics for a single vault type."""
    vault_type: str
    total_invested: float
    investor_count: int
    opportunity_count: int
    expected_irr: float | None = None
    actual_irr: float | None = None
