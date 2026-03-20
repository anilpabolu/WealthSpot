"""
Approval request schemas (Pydantic v2).
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.approval import ApprovalCategory, ApprovalPriority, ApprovalStatus


# ── Read ─────────────────────────────────────────────────────────────────────

class ApprovalRequesterRead(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    avatar_url: str | None = None
    model_config = {"from_attributes": True}


class ApprovalRead(BaseModel):
    id: uuid.UUID
    requester_id: uuid.UUID
    reviewer_id: uuid.UUID | None = None
    category: ApprovalCategory
    status: ApprovalStatus
    priority: ApprovalPriority
    title: str
    description: str | None = None
    resource_type: str | None = None
    resource_id: str | None = None
    payload: dict | None = None
    review_note: str | None = None
    auto_approve: bool
    created_at: datetime
    reviewed_at: datetime | None = None
    # Nested user info
    requester: ApprovalRequesterRead | None = None
    reviewer: ApprovalRequesterRead | None = None

    model_config = {"from_attributes": True}


class PaginatedApprovals(BaseModel):
    items: list[ApprovalRead]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Create ───────────────────────────────────────────────────────────────────

class ApprovalCreate(BaseModel):
    category: ApprovalCategory
    title: str = Field(min_length=3, max_length=500)
    description: str | None = None
    priority: ApprovalPriority = ApprovalPriority.NORMAL
    resource_type: str | None = None
    resource_id: str | None = None
    payload: dict | None = None


# ── Review ───────────────────────────────────────────────────────────────────

class ApprovalReviewRequest(BaseModel):
    action: str = Field(pattern=r"^(approve|reject)$")
    review_note: str | None = None
