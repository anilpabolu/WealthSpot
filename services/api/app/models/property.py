"""
Property & Builder models.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum as PyEnum
from typing import Any, Sequence

from sqlalchemy import (
    Boolean, DateTime, Enum, ForeignKey, Integer, Numeric,
    String, Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _enum_values(enum_cls: type[PyEnum]) -> Sequence[str]:
    """Extract string values from a Python enum for SQLAlchemy Enum columns."""
    return [member.value for member in enum_cls]


class AssetType(str, PyEnum):
    RESIDENTIAL = "Residential"
    COMMERCIAL = "Commercial"
    WAREHOUSING = "Warehousing"
    PLOTTED = "Plotted Development"
    MIXED_USE = "Mixed Use"


class PropertyStatus(str, PyEnum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    ACTIVE = "active"
    FUNDING = "funding"
    FUNDED = "funded"
    EXITED = "exited"
    REJECTED = "rejected"
    ARCHIVED = "archived"  # soft-deleted by admin


class Builder(Base):
    __tablename__ = "builders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rera_number: Mapped[str | None] = mapped_column(String(50))
    cin: Mapped[str | None] = mapped_column(String(21))
    gstin: Mapped[str | None] = mapped_column(String(15))
    website: Mapped[str | None] = mapped_column(Text)
    logo_url: Mapped[str | None] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(Text)
    city: Mapped[str | None] = mapped_column(String(100))
    experience_years: Mapped[int | None] = mapped_column(Integer)
    projects_completed: Mapped[int] = mapped_column(Integer, default=0)
    total_sqft_delivered: Mapped[int] = mapped_column(Integer, default=0)
    about: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    properties = relationship("Property", back_populates="builder", lazy="selectin")
    user = relationship("User", lazy="joined")


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    builder_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("builders.id"), nullable=False, index=True
    )
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    tagline: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    asset_type: Mapped[AssetType] = mapped_column(
        Enum(AssetType, native_enum=False, length=50, values_callable=_enum_values), nullable=False
    )
    status: Mapped[PropertyStatus] = mapped_column(
        Enum(PropertyStatus, native_enum=False, length=20, values_callable=_enum_values),
        default=PropertyStatus.DRAFT,
        nullable=False,
        index=True,
    )

    # Location
    city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    locality: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str | None] = mapped_column(Text)
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))

    # Financial
    target_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    raised_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0"))
    min_investment: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_units: Mapped[int] = mapped_column(Integer, nullable=False)
    sold_units: Mapped[int] = mapped_column(Integer, default=0)
    target_irr: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    rental_yield: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))

    # Details
    area_sqft: Mapped[int | None] = mapped_column(Integer)
    bedrooms: Mapped[int | None] = mapped_column(Integer)
    possession_date: Mapped[str | None] = mapped_column(String(20))
    rera_id: Mapped[str | None] = mapped_column(String(50))

    # Media
    cover_image: Mapped[str | None] = mapped_column(Text)
    gallery: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    video_url: Mapped[str | None] = mapped_column(Text)
    documents: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    amenities: Mapped[list[str] | None] = mapped_column(ARRAY(String(100)))

    # Highlights & USP
    highlights: Mapped[list[str] | None] = mapped_column(ARRAY(Text), default=list)
    usp: Mapped[str | None] = mapped_column(Text)

    # Referrer (person who shared/listed this property)
    referrer_name: Mapped[str | None] = mapped_column(String(255))
    referrer_phone: Mapped[str | None] = mapped_column(String(20))
    referrer_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )

    # Counts
    investor_count: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    launch_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    builder = relationship("Builder", back_populates="properties")
    investments = relationship("Investment", back_populates="property", lazy="selectin")
    referrer = relationship("User", foreign_keys="[Property.referrer_user_id]", lazy="joined")

    @property
    def funding_percentage(self) -> float:
        if self.target_amount <= 0:
            return 0.0
        return float(self.raised_amount / self.target_amount * 100)

    def __repr__(self) -> str:
        return f"<Property {self.slug} status={self.status}>"
