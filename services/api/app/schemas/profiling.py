"""
Pydantic schemas for profiling & matching endpoints.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict

# ── Vault Profile Questions ──────────────────────────────────────────────────


class VaultProfileQuestionRead(BaseModel):
    id: UUID
    vault_type: str
    category: str
    question_text: str
    question_type: str
    options: Any | None = None
    weight: float
    dimension: str | None = None
    sort_order: int
    is_required: bool
    fun_fact: str | None = None
    illustration: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ── User Profile Answers ────────────────────────────────────────────────────


class UserProfileAnswerCreate(BaseModel):
    question_id: UUID
    vault_type: str
    answer_value: Any  # string, array, or number


class UserProfileAnswerBulk(BaseModel):
    """Submit multiple answers at once (full vault questionnaire)."""

    vault_type: str
    answers: list[UserProfileAnswerCreate]


class UserProfileAnswerRead(BaseModel):
    id: UUID
    user_id: UUID
    question_id: UUID
    vault_type: str
    answer_value: Any
    answer_score: float | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Opportunity Custom Questions ─────────────────────────────────────────────


class OpportunityCustomQuestionCreate(BaseModel):
    question_text: str
    question_type: str = "text"
    options: Any | None = None
    weight: float = 1.0
    dimension: str | None = None
    sort_order: int = 0
    is_required: bool = True


class OpportunityCustomQuestionRead(BaseModel):
    id: UUID
    opportunity_id: UUID
    question_text: str
    question_type: str
    options: Any | None = None
    weight: float
    dimension: str | None = None
    sort_order: int
    is_required: bool
    is_auto_generated: bool
    source_hint: str | None = None

    model_config = ConfigDict(from_attributes=True)


# ── Opportunity Application Answers ──────────────────────────────────────────


class OpportunityApplicationAnswerCreate(BaseModel):
    question_id: UUID
    answer_value: Any


class OpportunityApplicationBulk(BaseModel):
    """Submit answers when applying to an opportunity."""

    opportunity_id: UUID
    answers: list[OpportunityApplicationAnswerCreate]


class OpportunityApplicationAnswerRead(BaseModel):
    id: UUID
    user_id: UUID
    opportunity_id: UUID
    question_id: UUID
    answer_value: Any
    answer_score: float | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Personality Dimensions ───────────────────────────────────────────────────


class PersonalityDimensionRead(BaseModel):
    user_id: UUID
    vault_type: str
    risk_appetite: float = 0
    domain_expertise: float = 0
    investment_capacity: float = 0
    time_commitment: float = 0
    network_strength: float = 0
    creativity_score: float = 0
    leadership_score: float = 0
    collaboration_score: float = 0
    raw_dimensions: dict[str, Any] = {}
    archetype_label: str | None = None
    archetype_description: str | None = None
    computed_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ── Profile Match Scores ────────────────────────────────────────────────────


class MatchScoreRead(BaseModel):
    user_id: UUID
    opportunity_id: UUID
    overall_score: float
    dimension_scores: dict[str, float] = {}
    breakdown: dict[str, Any] | None = None
    archetype_compatibility: str | None = None
    computed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MatchedUserRead(BaseModel):
    """For opportunity creator – see who matches their opportunity."""

    user_id: UUID
    full_name: str
    avatar_url: str | None = None
    overall_score: float
    dimension_scores: dict[str, float] = {}
    top_strengths: list[str] = []  # e.g. ["High investment capacity", "Strong network"]
    compatibility_note: str | None = None  # human-readable note
    archetype_label: str | None = None
    archetype_compatibility: str | None = None


class OpportunityMatchesResponse(BaseModel):
    opportunity_id: UUID
    total_matches: int
    matches: list[MatchedUserRead]


# ── Profiling Progress ──────────────────────────────────────────────────────


class ProfilingProgressRead(BaseModel):
    vault_type: str
    total_questions: int
    answered_questions: int
    completion_pct: float
    is_complete: bool
    personality: PersonalityDimensionRead | None = None


# ── Overall Progress ─────────────────────────────────────────────────────────


class VaultProgressDetail(BaseModel):
    total: int
    answered: int
    pct: float
    is_complete: bool
    archetype: str | None = None


class OverallProgressRead(BaseModel):
    profile_pct: int
    vaults: dict[str, VaultProgressDetail]
    overall_pct: int
    is_fully_profiled: bool
