"""
OpportunityDocument — structured replacement for the documents JSONB blob on Opportunity.

Each row represents a single document (pitch deck, legal agreement, map, etc.)
attached to an opportunity.  The legacy JSONB column is retained on the
Opportunity table during the migration window; once all reads go through this
model the column can be dropped.

# TENANCY: workspace-scope candidate — opportunity_id already scopes these rows
# to a single opportunity, but a future workspace_id composite index would be
# needed for efficient cross-tenant queries.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class OpportunityDocument(Base):
    __tablename__ = "opportunity_documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    opportunity_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("opportunities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Semantic document type — e.g. "pitch_deck", "legal_agreement", "property_map",
    # "financial_projection", "due_diligence".  Kept flexible (VARCHAR not enum)
    # so new doc types require no migration.
    doc_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # Human-readable display name.  Falls back to doc_type when null.
    label: Mapped[str | None] = mapped_column(String(255))
    # Presigned-URL or S3 key, depending on the caller's convention.
    url: Mapped[str] = mapped_column(Text, nullable=False)
    # Who uploaded the document.  Nullable because legacy JSONB rows have no attribution.
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        nullable=False,
    )

    # Relationships
    opportunity = relationship("Opportunity", back_populates="opportunity_documents")
    uploader = relationship("User", lazy="select")
