"""
Pydantic schemas for WealthSpot Shield assessments.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

RiskSeverity = Literal["low", "medium", "high"]


# ── Read models ──────────────────────────────────────────────────────────────


class AssessmentDocumentRead(BaseModel):
    id: str
    filename: str | None = None
    content_type: str | None = None
    size_bytes: int | None = None
    url: str | None = None  # null when the viewer cannot download it yet
    locked: bool = False


class AssessmentSubItemRead(BaseModel):
    code: str
    label: str
    status: str
    has_evidence: bool = False
    risk_severity: RiskSeverity | None = None
    reviewer_note: str | None = None
    documents: list[AssessmentDocumentRead] = Field(default_factory=list)
    builder_answer: dict[str, Any] | None = None
    reviewed_at: datetime | None = None


class AssessmentCategoryRead(BaseModel):
    code: str
    status: str
    passed_count: int
    total_count: int
    sub_items: list[AssessmentSubItemRead]


class OpportunityRiskFlagRead(BaseModel):
    id: uuid.UUID
    label: str
    severity: RiskSeverity
    note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AssessmentSummaryRead(BaseModel):
    opportunity_id: uuid.UUID
    overall: str  # not_started | in_review | partial | certified
    passed_count: int
    total_count: int
    certified: bool
    categories: list[AssessmentCategoryRead]
    risks: list[OpportunityRiskFlagRead]


# ── Write models ─────────────────────────────────────────────────────────────


class AssessmentBulkItem(BaseModel):
    category_code: str
    subcategory_code: str
    builder_answer: dict[str, Any] | None = None


class AssessmentBulkUpdateRequest(BaseModel):
    items: list[AssessmentBulkItem]


class AssessmentReviewRequest(BaseModel):
    action: Literal["pass", "flag", "na"]
    reviewer_note: str | None = None
    risk_severity: RiskSeverity | None = None


class OpportunityRiskFlagCreate(BaseModel):
    label: str = Field(min_length=3, max_length=100)
    severity: RiskSeverity
    note: str | None = None


# ── Metrics ──────────────────────────────────────────────────────────────────


class ShieldFunnel(BaseModel):
    not_started: int = 0
    in_review: int = 0
    partial: int = 0
    certified: int = 0


class ShieldTopFlagged(BaseModel):
    category_code: str
    subcategory_code: str
    flagged_count: int


class ShieldRiskCounts(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0


class ShieldMetricsRead(BaseModel):
    funnel: ShieldFunnel
    top_flagged: list[ShieldTopFlagged]
    avg_time_to_certify_days: float | None = None
    risk_counts: ShieldRiskCounts
