"""
Company schemas (Pydantic v2).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.company import EntityType, VerificationStatus
from app.models.opportunity import VaultType


class CompanyCreateRequest(BaseModel):
    company_name: str = Field(min_length=2, max_length=255)
    brand_name: str | None = None
    entity_type: EntityType = EntityType.PRIVATE_LIMITED
    vault_type: VaultType | None = None
    cin: str | None = Field(None, max_length=21)
    gstin: str | None = Field(None, max_length=15)
    pan: str | None = Field(None, max_length=10)
    rera_number: str | None = None
    website: str | None = None
    description: str | None = None
    # Contact
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    # Address
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    country: str = "India"
    # Track record
    years_in_business: int | None = None
    projects_completed: int | None = None
    total_area_developed: str | None = None


class CompanyRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    company_name: str
    brand_name: str | None = None
    entity_type: EntityType
    vault_type: VaultType | None = None
    cin: str | None = None
    gstin: str | None = None
    pan: str | None = None
    rera_number: str | None = None
    website: str | None = None
    logo_url: str | None = None
    description: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    country: str = "India"
    years_in_business: int | None = None
    projects_completed: int = 0
    total_area_developed: str | None = None
    verified: bool = False
    verification_status: VerificationStatus = VerificationStatus.PENDING
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CompanyListItem(BaseModel):
    id: uuid.UUID
    company_name: str
    brand_name: str | None = None
    entity_type: EntityType
    vault_type: VaultType | None = None
    logo_url: str | None = None
    city: str | None = None
    verified: bool = False
    projects_completed: int = 0

    model_config = {"from_attributes": True}


class CompanyUpdateRequest(BaseModel):
    """Partial update schema — only set fields are applied."""
    company_name: str | None = None
    brand_name: str | None = None
    entity_type: EntityType | None = None
    vault_type: VaultType | None = None
    cin: str | None = None
    gstin: str | None = None
    pan: str | None = None
    rera_number: str | None = None
    website: str | None = None
    description: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    country: str | None = None
    years_in_business: int | None = None
    projects_completed: int | None = None
    total_area_developed: str | None = None


class PaginatedCompanies(BaseModel):
    items: list[CompanyListItem]
    total: int
    page: int
    total_pages: int


class PincodeInfo(BaseModel):
    pincode: str
    office_name: str | None = None
    locality: str | None = None
    district: str | None = None
    state: str | None = None
    region: str | None = None
