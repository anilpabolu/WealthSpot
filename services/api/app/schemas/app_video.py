"""
Pydantic schemas for the app-wide video management system.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AppVideoBase(BaseModel):
    page: str = Field(..., max_length=100, description="Page identifier e.g. 'vaults', 'home'")
    section_tag: str = Field(..., max_length=200, description="Section tag e.g. 'wealth_vault_intro'")
    title: str = Field(..., max_length=300)
    description: str | None = None
    thumbnail_url: str | None = None
    additional_info: dict | None = None
    is_active: bool = True
    sort_order: int = 0


class AppVideoCreate(AppVideoBase):
    video_url: str = Field(..., description="Public URL of the video")


class AppVideoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    additional_info: dict | None = None
    is_active: bool | None = None
    sort_order: int | None = None


class AppVideoRead(AppVideoBase):
    id: uuid.UUID
    video_url: str
    s3_key: str | None = None
    content_type: str | None = None
    size_bytes: int | None = None
    uploaded_by: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# Lightweight response for public consumption (no admin fields)
class AppVideoPublic(BaseModel):
    page: str
    section_tag: str
    title: str
    description: str | None = None
    video_url: str
    thumbnail_url: str | None = None

    model_config = {"from_attributes": True}


# Known pages for the dropdown in Command Control
APP_VIDEO_PAGES = [
    {"value": "vaults", "label": "Vaults Page"},
    {"value": "opportunity_detail", "label": "Opportunity Detail"},
    {"value": "home", "label": "Home Page"},
    {"value": "marketplace", "label": "Marketplace"},
    {"value": "portfolio", "label": "Portfolio"},
    {"value": "community", "label": "Community"},
]

# Pre-defined section tags per page
APP_VIDEO_SECTIONS = {
    "vaults": [
        {"value": "wealth_vault_intro", "label": "Wealth Vault Intro"},
        {"value": "opportunity_vault_intro", "label": "Opportunity Vault Intro"},
        {"value": "community_vault_intro", "label": "Community Vault Intro"},
        {"value": "wealth_investors_pillar", "label": "Wealth Investors Pillar"},
        {"value": "time_investors_pillar", "label": "Time Investors Pillar"},
        {"value": "network_investors_pillar", "label": "Network Investors Pillar"},
        {"value": "education_investors_pillar", "label": "Education Investors Pillar"},
    ],
    "opportunity_detail": [
        {"value": "property_tour", "label": "Property Tour Video"},
        {"value": "builder_intro", "label": "Builder Introduction"},
        {"value": "project_walkthrough", "label": "Project Walkthrough"},
    ],
    "home": [
        {"value": "hero_video", "label": "Hero Banner Video"},
        {"value": "how_it_works", "label": "How It Works"},
        {"value": "testimonials", "label": "Testimonials"},
    ],
    "marketplace": [
        {"value": "marketplace_intro", "label": "Marketplace Introduction"},
    ],
    "portfolio": [
        {"value": "portfolio_guide", "label": "Portfolio Guide"},
    ],
    "community": [
        {"value": "community_intro", "label": "Community Introduction"},
    ],
}
