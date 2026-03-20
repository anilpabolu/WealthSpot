"""
Approval model – generic approval workflow for all platform actions.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Any, Sequence

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, Integer, Boolean
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _enum_values(enum_cls: type[PyEnum]) -> Sequence[str]:
    return [member.value for member in enum_cls]


class ApprovalCategory(str, PyEnum):
    """Categories of items that require approval."""
    ROLE_ASSIGNMENT = "role_assignment"
    PILLAR_ACCESS = "pillar_access"
    OPPORTUNITY_LISTING = "opportunity_listing"
    PROPERTY_LISTING = "property_listing"
    KYC_VERIFICATION = "kyc_verification"
    COMMUNITY_PROJECT = "community_project"
    COMMUNITY_ANSWER = "community_answer"
    BUILDER_VERIFICATION = "builder_verification"
    TEMPLATE_UPLOAD = "template_upload"


class ApprovalStatus(str, PyEnum):
    """Lifecycle of an approval request."""
    PENDING = "pending"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    AUTO_APPROVED = "auto_approved"
    CANCELLED = "cancelled"


class ApprovalPriority(str, PyEnum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    # Who submitted the request
    requester_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    # Who reviewed it (null until reviewed)
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True,
    )
    # Category & status
    category: Mapped[ApprovalCategory] = mapped_column(
        Enum(ApprovalCategory, native_enum=False, length=40, values_callable=_enum_values),
        nullable=False, index=True,
    )
    status: Mapped[ApprovalStatus] = mapped_column(
        Enum(ApprovalStatus, native_enum=False, length=20, values_callable=_enum_values),
        default=ApprovalStatus.PENDING, nullable=False, index=True,
    )
    priority: Mapped[ApprovalPriority] = mapped_column(
        Enum(ApprovalPriority, native_enum=False, length=10, values_callable=_enum_values),
        default=ApprovalPriority.NORMAL, nullable=False,
    )
    # Human-readable title + description
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    # What resource is being approved
    resource_type: Mapped[str | None] = mapped_column(String(50))  # e.g. "property", "user", "opportunity"
    resource_id: Mapped[str | None] = mapped_column(String(255))
    # Flexible payload (form data, template data, etc.)
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    # Reviewer's comment
    review_note: Mapped[str | None] = mapped_column(Text)
    # Auto-approve config
    auto_approve: Mapped[bool] = mapped_column(Boolean, default=False)
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True,
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    requester = relationship("User", foreign_keys=[requester_id], lazy="joined")
    reviewer = relationship("User", foreign_keys=[reviewer_id], lazy="joined")

    def __repr__(self) -> str:
        return f"<ApprovalRequest {self.id} category={self.category} status={self.status}>"
