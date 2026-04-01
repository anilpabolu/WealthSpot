"""
EOI schemas (Pydantic v2) – Expression of Interest, Builder Questions, Communication Mappings.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ── Builder Questions ────────────────────────────────────────────────────────

class BuilderQuestionCreate(BaseModel):
    question_text: str = Field(min_length=3, max_length=1000)
    question_type: str = "text"  # text, select, number, boolean
    options: dict | None = None  # for select type: {"choices": ["A", "B", "C"]}
    is_required: bool = True
    sort_order: int = 0


class BuilderQuestionRead(BaseModel):
    id: uuid.UUID
    opportunity_id: uuid.UUID
    creator_id: uuid.UUID
    question_text: str
    question_type: str
    options: dict | None = None
    is_required: bool
    sort_order: int
    created_at: datetime
    model_config = {"from_attributes": True}


class BuilderQuestionUpdate(BaseModel):
    question_text: str | None = Field(None, min_length=3, max_length=1000)
    question_type: str | None = None
    options: dict | None = None
    is_required: bool | None = None
    sort_order: int | None = None


# ── EOI Question Answers ────────────────────────────────────────────────────

class EOIAnswerCreate(BaseModel):
    question_id: str
    answer_text: str | None = None


class EOIAnswerRead(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    answer_text: str | None = None
    question: BuilderQuestionRead | None = None
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Expression of Interest ──────────────────────────────────────────────────

class EOICreate(BaseModel):
    opportunity_id: str
    investment_amount: float | None = None
    num_units: int | None = None
    investment_timeline: str | None = None  # immediate, 1-3 months, 3-6 months, exploring
    funding_source: str | None = None  # own_funds, bank_loan, both
    purpose: str | None = None  # self_use, investment, rental_income
    preferred_contact: str | None = None  # phone, email, whatsapp
    best_time_to_contact: str | None = None
    communication_consent: bool = True
    additional_notes: str | None = None
    # Builder custom question answers
    answers: list[EOIAnswerCreate] = []


class EOIUserRead(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    avatar_url: str | None = None
    phone: str | None = None
    role: str | None = None
    kyc_status: str | None = None
    city: str | None = None
    state: str | None = None
    occupation: str | None = None
    annual_income: str | None = None
    investment_experience: str | None = None
    risk_tolerance: str | None = None
    referral_code: str | None = None
    created_at: datetime | None = None
    model_config = {"from_attributes": True}


class EOIOpportunitySummary(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    vault_type: str
    model_config = {"from_attributes": True}


class EOIStageHistoryRead(BaseModel):
    id: uuid.UUID
    status: str
    changed_by: uuid.UUID | None = None
    changed_at: datetime
    model_config = {"from_attributes": True}


class EOIRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    opportunity_id: uuid.UUID
    investment_amount: float | None = None
    num_units: int | None = None
    investment_timeline: str | None = None
    funding_source: str | None = None
    purpose: str | None = None
    preferred_contact: str | None = None
    best_time_to_contact: str | None = None
    communication_consent: bool = True
    additional_notes: str | None = None
    status: str
    referrer_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
    user: EOIUserRead | None = None
    opportunity: EOIOpportunitySummary | None = None
    answers: list[EOIAnswerRead] = []
    referrer: EOIUserRead | None = None
    stage_history: list[EOIStageHistoryRead] = []
    model_config = {"from_attributes": True}


class PaginatedEOIs(BaseModel):
    items: list[EOIRead]
    total: int
    page: int
    page_size: int
    total_pages: int


# ── Communication Mapping ───────────────────────────────────────────────────

class CommMappingCreate(BaseModel):
    opportunity_id: str
    user_id: str
    role: str = Field(pattern=r"^(builder|handler|admin|platform_admin)$")


class CommMappingUserRead(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    avatar_url: str | None = None
    model_config = {"from_attributes": True}


class CommMappingRead(BaseModel):
    id: uuid.UUID
    opportunity_id: uuid.UUID
    user_id: uuid.UUID
    role: str
    created_at: datetime
    user: CommMappingUserRead | None = None
    model_config = {"from_attributes": True}
