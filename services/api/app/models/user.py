"""
User model – investors, builders, lenders, admins.
"""

import uuid
from datetime import date, datetime, timezone
from enum import Enum as PyEnum
from typing import Sequence

from sqlalchemy import (
    BigInteger, Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
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

    # ── Risk Profile & Investment Appetite ───────────────────────────────────
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    gender: Mapped[str | None] = mapped_column(String(20))
    occupation: Mapped[str | None] = mapped_column(String(100))
    annual_income: Mapped[str | None] = mapped_column(String(50))
    investment_experience: Mapped[str | None] = mapped_column(String(30))
    risk_tolerance: Mapped[str | None] = mapped_column(String(20))
    investment_horizon: Mapped[str | None] = mapped_column(String(30))
    monthly_investment_capacity: Mapped[str | None] = mapped_column(String(50))

    # ── Interests ────────────────────────────────────────────────────────────
    interests: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    preferred_cities: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    subscription_topics: Mapped[list[str] | None] = mapped_column(ARRAY(String))

    # ── Skills & Availability ────────────────────────────────────────────────
    skills: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    weekly_hours_available: Mapped[str | None] = mapped_column(String(20))
    contribution_interests: Mapped[list[str] | None] = mapped_column(ARRAY(String))

    # ── Address ──────────────────────────────────────────────────────────────
    address_line1: Mapped[str | None] = mapped_column(String(255))
    address_line2: Mapped[str | None] = mapped_column(String(255))
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    pincode: Mapped[str | None] = mapped_column(String(6))
    country: Mapped[str | None] = mapped_column(String(50), default="India")

    # ── OTP Verification ─────────────────────────────────────────────────────
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_otp_hash: Mapped[str | None] = mapped_column(String(128))
    phone_otp_hash: Mapped[str | None] = mapped_column(String(128))
    email_otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    phone_otp_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # ── Profile Completion ───────────────────────────────────────────────────
    profile_completion_pct: Mapped[int] = mapped_column(Integer, default=0)
    profile_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    bio: Mapped[str | None] = mapped_column(Text)

    # ── Notification Preferences ─────────────────────────────────────────────
    notification_preferences: Mapped[dict | None] = mapped_column(JSONB)

    # ── Persona / Multi-Role ─────────────────────────────────────────────────
    roles: Mapped[list] = mapped_column(JSONB, nullable=False, default=lambda: ["investor"])
    primary_role: Mapped[str] = mapped_column(String(50), nullable=False, default="investor")
    builder_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    builder_approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    builder_approved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    persona_selected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

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
    bank_details = relationship("BankDetail", back_populates="user", lazy="selectin")

    def __repr__(self) -> str:
        return f"<User {self.email} role={self.role}>"

    # ── Persona helpers ──────────────────────────────────────────────────────

    def has_role(self, role: str) -> bool:
        """Check if the user holds a specific role in their roles array."""
        return role in (self.roles or [])

    def is_builder_active(self) -> bool:
        """Builder role present AND approved by super_admin."""
        return self.has_role("builder") and self.builder_approved


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
    original_filename: Mapped[str | None] = mapped_column(String(255))
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    mime_type: Mapped[str | None] = mapped_column(String(100))
    verification_status: Mapped[str] = mapped_column(
        String(20), default="PENDING"
    )  # PENDING / VERIFIED / REJECTED
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="kyc_documents")

    __table_args__ = (
        {"comment": "KYC identity documents uploaded by users"},
    )


class BankDetail(Base):
    __tablename__ = "bank_details"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    account_holder_name_enc: Mapped[str] = mapped_column(Text, nullable=False)
    account_number_enc: Mapped[str] = mapped_column(Text, nullable=False)
    ifsc_code_enc: Mapped[str] = mapped_column(Text, nullable=False)
    bank_name_enc: Mapped[str] = mapped_column(Text, nullable=False)
    branch_name_enc: Mapped[str | None] = mapped_column(Text)
    account_type: Mapped[str] = mapped_column(String(20), default="savings")
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="bank_details")

    __table_args__ = (
        {"comment": "Bank details with encrypted sensitive fields"},
    )
