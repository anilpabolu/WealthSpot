"""
BuilderQuestion model – custom questions defined by builders per opportunity.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Any, Sequence

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _enum_values(enum_cls: type[PyEnum]) -> Sequence[str]:
    return [member.value for member in enum_cls]


class QuestionType(str, PyEnum):
    TEXT = "text"
    SELECT = "select"
    NUMBER = "number"
    BOOLEAN = "boolean"


class BuilderQuestion(Base):
    __tablename__ = "builder_questions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[QuestionType] = mapped_column(
        Enum(QuestionType, native_enum=False, length=30, values_callable=_enum_values),
        default=QuestionType.TEXT, nullable=False,
    )
    options: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    opportunity = relationship("Opportunity", lazy="joined", overlaps="builder_questions")
    creator = relationship("User", lazy="joined")


class EOIQuestionAnswer(Base):
    __tablename__ = "eoi_question_answers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    eoi_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expressions_of_interest.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("builder_questions.id", ondelete="CASCADE"),
        nullable=False,
    )
    answer_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    eoi = relationship("ExpressionOfInterest", back_populates="answers")
    question = relationship("BuilderQuestion", lazy="joined")
