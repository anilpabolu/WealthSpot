"""
Opportunity model – multi-vault investment opportunities (Wealth / Opportunity / Community).
"""

import uuid
from collections.abc import Sequence
from datetime import UTC, datetime
from decimal import Decimal
from enum import Enum as PyEnum
from typing import Any

from sqlalchemy import (
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def _enum_values(enum_cls: type[PyEnum]) -> Sequence[str]:
    return [member.value for member in enum_cls]


class VaultType(str, PyEnum):
    WEALTH = "wealth"
    OPPORTUNITY = "opportunity"
    COMMUNITY = "community"


class OpportunityStatus(str, PyEnum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    ACTIVE = "active"
    FUNDING = "funding"
    FUNDED = "funded"
    REJECTED = "rejected"
    CLOSED = "closed"
    ARCHIVED = "archived"


class ProjectPhase(str, PyEnum):
    PLANNING = "planning"
    LAND_ACQUISITION = "land_acquisition"
    APPROVALS_IN_PROGRESS = "approvals_in_progress"
    FOUNDATION = "foundation"
    STRUCTURE = "structure"
    FINISHING = "finishing"
    POSSESSION_READY = "possession_ready"
    COMPLETED = "completed"


class Opportunity(Base):
    __tablename__ = "opportunities"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Who created it
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Vault classification
    vault_type: Mapped[VaultType] = mapped_column(
        Enum(VaultType, native_enum=False, length=20, values_callable=_enum_values),
        nullable=False,
        index=True,
    )
    status: Mapped[OpportunityStatus] = mapped_column(
        Enum(OpportunityStatus, native_enum=False, length=20, values_callable=_enum_values),
        default=OpportunityStatus.DRAFT,
        nullable=False,
        index=True,
    )
    # Linked approval request
    approval_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("approval_requests.id"),
    )
    # Core details
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    tagline: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)
    # Location (for wealth/community vaults)
    city: Mapped[str | None] = mapped_column(String(100), index=True)
    state: Mapped[str | None] = mapped_column(String(100))
    address: Mapped[str | None] = mapped_column(Text)
    address_line1: Mapped[str | None] = mapped_column(Text)
    address_line2: Mapped[str | None] = mapped_column(Text)
    landmark: Mapped[str | None] = mapped_column(Text)
    locality: Mapped[str | None] = mapped_column(Text)
    pincode: Mapped[str | None] = mapped_column(String(10))
    district: Mapped[str | None] = mapped_column(Text)
    country: Mapped[str] = mapped_column(String(100), default="India")
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 7))
    # Financials
    target_amount: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    raised_amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0"))
    min_investment: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    target_irr: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    expected_irr: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    actual_irr: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    # Startup-specific (opportunity vault)
    industry: Mapped[str | None] = mapped_column(String(100))
    stage: Mapped[str | None] = mapped_column(String(50))  # pre-seed, seed, series-a, etc.
    founder_name: Mapped[str | None] = mapped_column(String(255))
    pitch_deck_url: Mapped[str | None] = mapped_column(Text)
    # Community-specific
    community_type: Mapped[str | None] = mapped_column(
        String(100)
    )  # sports complex, co-working, etc.
    collaboration_type: Mapped[str | None] = mapped_column(
        String(100)
    )  # time, network, expertise, capital
    community_subtype: Mapped[str | None] = mapped_column(String(20))  # co_investor, co_partner
    community_details: Mapped[dict[str, Any] | None] = mapped_column(
        JSONB
    )  # subtype-specific fields
    # Project lifecycle phase
    project_phase: Mapped[str | None] = mapped_column(String(50))
    # Valuation (appreciation tracking)
    current_valuation: Mapped[Decimal | None] = mapped_column(Numeric(15, 2))
    # Media
    cover_image: Mapped[str | None] = mapped_column(Text)
    video_url: Mapped[str | None] = mapped_column(Text)
    gallery: Mapped[list[str] | None] = mapped_column(ARRAY(Text))
    documents: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    # Template upload reference
    template_s3_key: Mapped[str | None] = mapped_column(Text)
    template_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    # Company / builder link
    company_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        index=True,
    )
    # Stats
    investor_count: Mapped[int] = mapped_column(Integer, default=0)
    # Timestamps
    launch_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closing_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
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
    creator = relationship("User", lazy="joined")
    approval = relationship("ApprovalRequest", lazy="joined")
    media = relationship(
        "OpportunityMedia",
        back_populates="opportunity",
        lazy="selectin",
        order_by="OpportunityMedia.sort_order",
    )
    company = relationship("Company", back_populates="opportunities", lazy="joined")
    investments = relationship(
        "OpportunityInvestment", back_populates="opportunity", lazy="selectin"
    )
    builder_questions = relationship(
        "BuilderQuestion", lazy="selectin", order_by="BuilderQuestion.sort_order"
    )
    comm_mappings = relationship("OpportunityCommMapping", lazy="selectin")
    builder_updates = relationship(
        "BuilderUpdate",
        back_populates="opportunity",
        lazy="selectin",
        order_by="BuilderUpdate.created_at.desc()",
    )

    def __repr__(self) -> str:
        return f"<Opportunity {self.slug} vault={self.vault_type} status={self.status}>"
