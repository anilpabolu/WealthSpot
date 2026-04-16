"""
BuilderUpdate & BuilderUpdateAttachment models –
property/opportunity updates posted by builders or admins.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text, BigInteger
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BuilderUpdate(Base):
    __tablename__ = "builder_updates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    creator_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    opportunity = relationship("Opportunity", back_populates="builder_updates")
    creator = relationship("User", lazy="joined")
    attachments = relationship(
        "BuilderUpdateAttachment",
        back_populates="builder_update",
        cascade="all, delete-orphan",
        order_by="BuilderUpdateAttachment.created_at",
    )

    def __repr__(self) -> str:
        return f"<BuilderUpdate {self.title!r} opp={self.opportunity_id}>"


class BuilderUpdateAttachment(Base):
    __tablename__ = "builder_update_attachments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    update_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("builder_updates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename: Mapped[str | None] = mapped_column(Text)
    s3_key: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(100))
    size_bytes: Mapped[int | None] = mapped_column(BigInteger)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    builder_update = relationship("BuilderUpdate", back_populates="attachments")

    def __repr__(self) -> str:
        return f"<BuilderUpdateAttachment {self.filename!r}>"
