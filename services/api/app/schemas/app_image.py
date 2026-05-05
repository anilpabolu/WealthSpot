"""
Pydantic schemas for the app-wide image management system.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AppImageBase(BaseModel):
    page: str = Field(..., max_length=100, description="Page identifier e.g. 'home'")
    section_tag: str = Field(..., max_length=200, description="Section tag e.g. 'hero_image'")
    title: str = Field(..., max_length=300)
    description: str | None = None
    alt_text: str | None = None
    additional_info: dict | None = None
    is_active: bool = True
    sort_order: int = 0


class AppImageCreate(AppImageBase):
    image_url: str = Field(..., description="Public URL of the image")


class AppImageUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    alt_text: str | None = None
    additional_info: dict | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class AppImageRead(AppImageBase):
    id: uuid.UUID
    image_url: str
    s3_key: str | None = None
    content_type: str | None = None
    size_bytes: int | None = None
    uploaded_by: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Lightweight response for public consumption (no admin fields)
class AppImagePublic(BaseModel):
    page: str
    section_tag: str
    title: str
    description: str | None = None
    image_url: str
    alt_text: str | None = None

    model_config = {"from_attributes": True}


# Known pages for the dropdown in Command Control
APP_IMAGE_PAGES = [
    {"value": "home", "label": "Home Page"},
    {"value": "marketplace", "label": "Marketplace"},
    {"value": "vaults", "label": "Vaults Page"},
    {"value": "community", "label": "Community"},
]

# Pre-defined section tags per page
APP_IMAGE_SECTIONS = {
    "home": [
        {"value": "hero_image", "label": "Hero Journey Image"},
        {"value": "og_image", "label": "Social Preview Image"},
    ],
    "marketplace": [
        {"value": "marketplace_hero", "label": "Marketplace Hero"},
    ],
    "vaults": [
        {"value": "vaults_hero", "label": "Vaults Hero"},
    ],
    "community": [
        {"value": "community_hero", "label": "Community Hero"},
    ],
}
