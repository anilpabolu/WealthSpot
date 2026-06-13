"""
Investment Ledger models – an editable, detailed per-investment ledger shown
under the Portfolio → Holdings section.

The ledger is a non-destructive overlay over the user's confirmed investments:
  - An entry whose `opportunity_investment_id` or `legacy_investment_id` is set is
    an *overlay* on a real derived holding (carries the user's saved edits).
  - An entry with both of those NULL is a *manual* back-entry the user added; it
    must still reference a listed asset via `opportunity_id` or `property_id`.

Collateral rows and document attachments hang off an entry (cascade-deleted).
Documents mirror the InvestmentTransactionRecord acknowledgement pattern
(private S3 object, presigned URL on view).
"""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class InvestmentLedgerEntry(Base):
    __tablename__ = "investment_ledger_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Listed asset this entry references (one of the two is set)
    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("opportunities.id", ondelete="SET NULL"), nullable=True
    )
    property_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="SET NULL"), nullable=True
    )

    # Source investment for overlay rows (both NULL ⇒ manual back-entry)
    opportunity_investment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("opportunity_investments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    legacy_investment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("investments.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Editable columns
    registered_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    opportunity_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    configuration: Mapped[str | None] = mapped_column(String(255), nullable=True)
    base_value: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    gst: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    gst_paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    total_value: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    referred_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    type_of_investment: Mapped[str | None] = mapped_column(String(100), nullable=True)
    extra_sqft: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    sweep_on_oc_loan: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    latest_updates: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        nullable=False,
    )

    collateral = relationship(
        "InvestmentLedgerCollateral",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="InvestmentLedgerCollateral.sort_order",
    )
    documents = relationship(
        "InvestmentLedgerDocument",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="InvestmentLedgerDocument.created_at",
    )


class InvestmentLedgerCollateral(Base):
    __tablename__ = "investment_ledger_collateral"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("investment_ledger_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project: Mapped[str | None] = mapped_column(String(255), nullable=True)
    unit_no: Mapped[str | None] = mapped_column(String(50), nullable=True)
    configuration: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sbua: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    unit_cost: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class InvestmentLedgerDocument(Base):
    __tablename__ = "investment_ledger_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("investment_ledger_entries.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    s3_key: Mapped[str] = mapped_column(Text, nullable=False)
    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    content_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
