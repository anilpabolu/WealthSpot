"""
Property schemas.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from typing import Any

from pydantic import BaseModel, Field

from app.models.property import AssetType, PropertyStatus


# ── Builder ──────────────────────────────────────────────────────────────────


class BuilderRead(BaseModel):
    id: uuid.UUID
    company_name: str
    rera_number: str | None = None
    logo_url: str | None = None
    verified: bool

    model_config = {"from_attributes": True}


# ── Property ─────────────────────────────────────────────────────────────────


class PropertyBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    tagline: str | None = None
    description: str | None = None
    asset_type: AssetType
    city: str
    state: str
    locality: str | None = None
    target_amount: Decimal = Field(gt=0)
    min_investment: Decimal = Field(gt=0)
    unit_price: Decimal = Field(gt=0)
    total_units: int = Field(gt=0)
    target_irr: Decimal = Field(ge=0, le=100)
    rental_yield: Decimal | None = None
    area_sqft: int | None = None
    possession_date: str | None = None
    rera_id: str | None = None
    amenities: list[str] | None = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: str | None = None
    tagline: str | None = None
    description: str | None = None
    status: PropertyStatus | None = None
    target_irr: Decimal | None = None
    rental_yield: Decimal | None = None
    cover_image: str | None = None
    amenities: list[str] | None = None


class PropertyListItem(BaseModel):
    id: uuid.UUID
    slug: str
    title: str
    tagline: str | None = None
    asset_type: AssetType
    status: PropertyStatus
    city: str
    locality: str | None = None
    cover_image: str | None = None
    target_amount: Decimal
    raised_amount: Decimal
    min_investment: Decimal
    target_irr: Decimal
    rental_yield: Decimal | None = None
    investor_count: int
    funding_percentage: float
    rera_id: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PropertyDetail(PropertyListItem):
    description: str | None = None
    state: str
    address: str | None = None
    unit_price: Decimal
    total_units: int
    sold_units: int
    area_sqft: int | None = None
    bedrooms: int | None = None
    possession_date: str | None = None
    gallery: list[str] | None = None
    documents: dict[str, Any] | None = None
    amenities: list[str] | None = None
    builder: BuilderRead | None = None
    launch_date: datetime | None = None
    updated_at: datetime

    model_config = {"from_attributes": True}


class PropertyFilters(BaseModel):
    city: str | None = None
    asset_type: AssetType | None = None
    status: PropertyStatus | None = None
    min_investment_min: Decimal | None = None
    min_investment_max: Decimal | None = None
    irr_min: Decimal | None = None
    irr_max: Decimal | None = None
    sort_by: str = "newest"
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=12, ge=1, le=50)
    search: str | None = None


class PaginatedProperties(BaseModel):
    properties: list[PropertyListItem]
    total: int
    page: int
    page_size: int
    total_pages: int
