"""
Builder-update schemas (Pydantic v2).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ── Attachment schemas ───────────────────────────────────────────────────────

class BuilderUpdateAttachmentRead(BaseModel):
    id: uuid.UUID
    filename: str | None = None
    url: str
    content_type: str | None = None
    size_bytes: int | None = None
    created_at: datetime
    model_config = {"from_attributes": True}


# ── BuilderUpdate schemas ────────────────────────────────────────────────────

class BuilderUpdateCreatorRead(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: str | None = None
    model_config = {"from_attributes": True}


class BuilderUpdateCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    description: str | None = None


class BuilderUpdatePatch(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    description: str | None = None


class BuilderUpdateRead(BaseModel):
    id: uuid.UUID
    opportunity_id: uuid.UUID
    creator: BuilderUpdateCreatorRead | None = None
    title: str
    description: str | None = None
    attachments: list[BuilderUpdateAttachmentRead] = []
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}
