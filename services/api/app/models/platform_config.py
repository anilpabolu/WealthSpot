"""
Platform configuration model – used by the Command Control Centre.
"""

import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, ForeignKey, String, Text, Boolean
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class PlatformConfig(Base):
    """Key-value configuration store for the Command Control Centre."""
    __tablename__ = "platform_configs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    section: Mapped[str] = mapped_column(String(100), nullable=False, index=True)  # e.g. "approvals", "notifications", "content"
    key: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    value: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    updater = relationship("User", lazy="joined")

    def __repr__(self) -> str:
        return f"<PlatformConfig {self.section}/{self.key}>"
