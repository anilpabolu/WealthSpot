"""
ExpressionOfInterest model – tracks investor interest in opportunities.
"""

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _enum_values(enum_cls: type[PyEnum]) -> Sequence[str]:
    return [member.value for member in enum_cls]


class EOIStatus(str, PyEnum):
    SUBMITTED = "submitted"
    BUILDER_CONNECTED = "builder_connected"
    DEAL_IN_PROGRESS = "deal_in_progress"
    PAYMENT_DONE = "payment_done"
    DEAL_COMPLETED = "deal_completed"
    TOKEN_PAID = "token_paid"
    CLOSED = "closed"


class ExpressionOfInterest(Base):
    __tablename__ = "expressions_of_interest"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Standard platform questions
    investment_amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    num_units: Mapped[int | None] = mapped_column(Integer)
    investment_timeline: Mapped[str | None] = mapped_column(String(50))
    funding_source: Mapped[str | None] = mapped_column(String(50))
    purpose: Mapped[str | None] = mapped_column(String(50))
    preferred_contact: Mapped[str | None] = mapped_column(String(30))
    best_time_to_contact: Mapped[str | None] = mapped_column(String(50))
    communication_consent: Mapped[bool] = mapped_column(Boolean, default=True)
    additional_notes: Mapped[str | None] = mapped_column(Text)
    # Status
    status: Mapped[EOIStatus] = mapped_column(
        Enum(EOIStatus, native_enum=False, length=30, values_callable=_enum_values),
        default=EOIStatus.SUBMITTED,
        nullable=False,
        index=True,
    )
    # Referrer tracking
    referrer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id], lazy="joined")
    opportunity = relationship("Opportunity", lazy="joined")
    answers = relationship("EOIQuestionAnswer", back_populates="eoi", lazy="selectin")
    referrer = relationship("User", foreign_keys=[referrer_id], lazy="joined")
    stage_history = relationship(
        "EoiStageHistory",
        back_populates="eoi",
        lazy="selectin",
        order_by="EoiStageHistory.changed_at",
    )
