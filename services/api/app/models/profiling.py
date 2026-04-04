"""
Profiling & matching models – vault profile questions, user answers,
opportunity custom questions, application answers, match scores, personality dimensions.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VaultProfileQuestion(Base):
    """Platform-level profiling questions per vault type."""
    __tablename__ = "vault_profile_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vault_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="general")
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(20), nullable=False, default="choice")
    options: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    weight: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False, default=Decimal("1.0"))
    dimension: Mapped[str | None] = mapped_column(String(50))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    fun_fact: Mapped[str | None] = mapped_column(Text)
    illustration: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


class UserProfileAnswer(Base):
    """User's response to a vault profiling question."""
    __tablename__ = "user_profile_answers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("vault_profile_questions.id", ondelete="CASCADE"), nullable=False)
    vault_type: Mapped[str] = mapped_column(String(20), nullable=False)
    answer_value: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    answer_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    question = relationship("VaultProfileQuestion", lazy="joined")


class OpportunityCustomQuestion(Base):
    """Creator-defined questions per opportunity (especially community vault)."""
    __tablename__ = "opportunity_custom_questions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    creator_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(20), nullable=False, default="text")
    options: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    weight: Mapped[Decimal] = mapped_column(Numeric(4, 2), nullable=False, default=Decimal("1.0"))
    dimension: Mapped[str | None] = mapped_column(String(50))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_auto_generated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    source_hint: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class OpportunityApplicationAnswer(Base):
    """Applicant's answer to an opportunity's custom question."""
    __tablename__ = "opportunity_application_answers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False)
    question_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("opportunity_custom_questions.id", ondelete="CASCADE"), nullable=False)
    answer_value: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    answer_score: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    question = relationship("OpportunityCustomQuestion", lazy="joined")


class ProfileMatchScore(Base):
    """Cached match score between a user and an opportunity."""
    __tablename__ = "profile_match_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    overall_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("0"))
    dimension_scores: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    breakdown: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    archetype_compatibility: Mapped[str | None] = mapped_column(String(50))
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class PersonalityDimension(Base):
    """Aggregated personality vector per user per vault."""
    __tablename__ = "personality_dimensions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    vault_type: Mapped[str] = mapped_column(String(20), nullable=False)
    risk_appetite: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"))
    domain_expertise: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"))
    investment_capacity: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"))
    time_commitment: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"))
    network_strength: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"))
    creativity_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"))
    leadership_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"))
    collaboration_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0"))
    raw_dimensions: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    archetype_label: Mapped[str | None] = mapped_column(String(50))
    archetype_description: Mapped[str | None] = mapped_column(Text)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
