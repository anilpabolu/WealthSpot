"""
UserVisitLog model – tracks user-specific visit counts and last visit time.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserVisitLog(Base):
    __tablename__ = "user_visit_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "source_type", "source_id", name="uq_user_source_visit"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
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
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="view",
        server_default="'view'",
    )
    visit_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default="0",
        comment="Total views by this user",
    )
    last_visited_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    user = relationship("User", lazy="joined")
