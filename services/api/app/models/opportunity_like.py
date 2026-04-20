"""
OpportunityLike + UserActivity models – likes/saves for opportunities
and a unified activity feed for the portfolio dashboard.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OpportunityLike(Base):
    __tablename__ = "opportunity_likes"
    __table_args__ = (UniqueConstraint("opportunity_id", "user_id", name="uq_opp_like_user"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    opportunity = relationship("Opportunity", lazy="joined")
    user = relationship("User", lazy="joined")


class UserActivity(Base):
    """Unified activity log for the portfolio 'recent activity' feed."""

    __tablename__ = "user_activities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    activity_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        index=True,
    )  # liked, unliked, shared, invested, eoi_submitted
    resource_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
    )  # opportunity, property
    resource_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
    )
    resource_title: Mapped[str] = mapped_column(Text, nullable=False)
    resource_slug: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
    )

    user = relationship("User", lazy="joined")
