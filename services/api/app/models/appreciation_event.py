"""
AppreciationEvent model – logs each valuation appreciation applied to an opportunity.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AppreciationEvent(Base):
    __tablename__ = "appreciation_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    opportunity_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    property_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    mode: Mapped[str] = mapped_column(String(20), nullable=False)  # 'percentage' or 'absolute'
    input_value: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    old_valuation: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    new_valuation: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )

    # Relationships
    opportunity = relationship("Opportunity", lazy="joined")
    property = relationship("Property", lazy="joined")
    creator = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        target = f"opp={self.opportunity_id}" if self.opportunity_id else f"prop={self.property_id}"
        return f"<AppreciationEvent {self.mode} {self.input_value} {target}>"
