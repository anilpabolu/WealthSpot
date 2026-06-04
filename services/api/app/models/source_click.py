"""
SourceClick model – tracks visit/click counts for vaults and opportunity tiles.

Each row represents a unique (source_type, source_id) pair with an
atomically-incrementable click_count column.  All visit counters across
the platform (vault entries, opportunity tile clicks, etc.) live in
this single table.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class SourceClick(Base):
    __tablename__ = "source_clicks"
    __table_args__ = (UniqueConstraint("source_type", "source_id", name="uq_source_click_type_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        comment="Category of the source: 'vault' or 'opportunity'",
    )
    source_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Identifier: vault slug (wealth/safe/community) or opportunity UUID",
    )
    click_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Auto-incremented visit counter",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
