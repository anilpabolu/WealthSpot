"""
User model – investors, builders, lenders, admins.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Sequence

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, String, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _enum_values(enum_cls: type[PyEnum]) -> Sequence[str]:
    """Extract string values from a Python enum for SQLAlchemy Enum columns."""
    return [member.value for member in enum_cls]


class UserRole(str, PyEnum):
    INVESTOR = "investor"
    BUILDER = "builder"
    LENDER = "lender"
    FOUNDER = "founder"
    COMMUNITY_LEAD = "community_lead"
    APPROVER = "approver"
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"


class KycStatus(str, PyEnum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    clerk_id: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    avatar_url: Mapped[str | None] = mapped_column(Text)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, length=20, values_callable=_enum_values),
        default=UserRole.INVESTOR,
        nullable=False,
    )
    kyc_status: Mapped[KycStatus] = mapped_column(
        Enum(KycStatus, native_enum=False, length=20, values_callable=_enum_values),
        default=KycStatus.NOT_STARTED,
        nullable=False,
    )
    pan_number: Mapped[str | None] = mapped_column(String(10))
    aadhaar_hash: Mapped[str | None] = mapped_column(String(64))
    referral_code: Mapped[str | None] = mapped_column(String(12), unique=True)
    referred_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    wealth_pass_active: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    investments = relationship("Investment", back_populates="user", lazy="selectin")
    kyc_documents = relationship("KycDocument", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.email} role={self.role}>"


class KycDocument(Base):
    __tablename__ = "kyc_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_type: Mapped[str] = mapped_column(String(50), nullable=False)  # PAN / AADHAAR / SELFIE
    s3_key: Mapped[str] = mapped_column(Text, nullable=False)
    verification_status: Mapped[str] = mapped_column(
        String(20), default="PENDING"
    )  # PENDING / VERIFIED / REJECTED
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="kyc_documents")

    __table_args__ = (
        {"comment": "KYC identity documents uploaded by users"},
    )
