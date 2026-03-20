"""
Company model – builder/developer/individual onboarding for opportunity creation.
"""

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from typing import Sequence

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer,
    String, Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _enum_values(enum_cls: type[PyEnum]) -> Sequence[str]:
    return [member.value for member in enum_cls]


class EntityType(str, PyEnum):
    PRIVATE_LIMITED = "private_limited"
    PUBLIC_LIMITED = "public_limited"
    LLP = "llp"
    PARTNERSHIP = "partnership"
    PROPRIETORSHIP = "proprietorship"
    TRUST = "trust"
    SOCIETY = "society"
    INDIVIDUAL = "individual"


class VerificationStatus(str, PyEnum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"),
        index=True,
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    brand_name: Mapped[str | None] = mapped_column(String(255))
    entity_type: Mapped[EntityType] = mapped_column(
        Enum(EntityType, native_enum=False, length=50, values_callable=_enum_values),
        default=EntityType.PRIVATE_LIMITED, nullable=False,
    )
    cin: Mapped[str | None] = mapped_column(String(21))
    gstin: Mapped[str | None] = mapped_column(String(15))
    pan: Mapped[str | None] = mapped_column(String(10))
    rera_number: Mapped[str | None] = mapped_column(String(50))
    website: Mapped[str | None] = mapped_column(Text)
    logo_url: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    # Contact
    contact_name: Mapped[str | None] = mapped_column(String(255))
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(20))
    # Address
    address_line1: Mapped[str | None] = mapped_column(Text)
    address_line2: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    pincode: Mapped[str | None] = mapped_column(String(10))
    country: Mapped[str] = mapped_column(String(100), default="India")
    # Track record
    years_in_business: Mapped[int | None] = mapped_column(Integer)
    projects_completed: Mapped[int] = mapped_column(Integer, default=0)
    total_area_developed: Mapped[str | None] = mapped_column(Text)
    # Verification
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, native_enum=False, length=20, values_callable=_enum_values),
        default=VerificationStatus.PENDING,
    )
    approval_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("approval_requests.id"),
    )
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", lazy="joined")
    opportunities = relationship("Opportunity", back_populates="company", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Company {self.company_name} status={self.verification_status}>"
