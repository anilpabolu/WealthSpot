"""
Community, Referral, AuditLog models.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Any, Sequence

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer, String, Text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _enum_values(enum_cls: type[PyEnum]) -> Sequence[str]:
    """Extract string values from a Python enum for SQLAlchemy Enum columns."""
    return [member.value for member in enum_cls]


# ── Community ────────────────────────────────────────────────────────────────


class PostType(str, PyEnum):
    DISCUSSION = "discussion"
    QUESTION = "question"
    POLL = "poll"
    ANNOUNCEMENT = "announcement"


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    post_type: Mapped[PostType] = mapped_column(
        Enum(PostType, native_enum=False, length=20, values_callable=_enum_values), default=PostType.DISCUSSION
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(50))
    tags: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    reply_count: Mapped[int] = mapped_column(Integer, default=0)
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    author = relationship("User", lazy="joined")
    replies = relationship("CommunityReply", back_populates="post", lazy="selectin")


class CommunityReply(Base):
    __tablename__ = "community_replies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    post_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("community_posts.id"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    post = relationship("CommunityPost", back_populates="replies")
    author = relationship("User", lazy="joined")


# ── Referral ─────────────────────────────────────────────────────────────────


class Referral(Base):
    __tablename__ = "referrals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    referrer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    referee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, unique=True
    )
    code_used: Mapped[str] = mapped_column(String(12), nullable=False)
    reward_amount: Mapped[int] = mapped_column(Integer, default=0)  # in paise
    reward_claimed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    referrer = relationship("User", foreign_keys=[referrer_id], lazy="joined")
    referee = relationship("User", foreign_keys=[referee_id], lazy="joined")


# ── Audit Log ────────────────────────────────────────────────────────────────


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    actor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    action: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String(255))
    details: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )

    def __repr__(self) -> str:
        return f"<AuditLog {self.action} on {self.resource_type}/{self.resource_id}>"


# ── Lender Loan ──────────────────────────────────────────────────────────────


class LoanStatus(str, PyEnum):
    ACTIVE = "active"
    REPAID = "repaid"
    DEFAULTED = "defaulted"
    PENDING = "pending"


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    lender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id"), nullable=False, index=True
    )
    principal: Mapped[int] = mapped_column(Integer, nullable=False)  # in paise
    interest_rate: Mapped[float] = mapped_column(nullable=False)
    tenure_months: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_repaid: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[LoanStatus] = mapped_column(
        Enum(LoanStatus, native_enum=False, length=20, values_callable=_enum_values),
        default=LoanStatus.PENDING,
        nullable=False,
    )
    next_payment_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    lender = relationship("User", lazy="joined")
    property = relationship("Property", lazy="joined")
