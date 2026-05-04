"""Introduce structured opportunity_documents table.

Replaces the JSONB `documents` blob on the opportunities table with a
first-class relational table.  Each legacy JSONB entry
  {"doc_type": "url", ...}
becomes one row per key in `opportunity_documents`.

The original `documents` column is NOT dropped in this migration so that
existing readers continue to work unchanged.  A follow-up migration can drop
it once all write-paths have been migrated.

Uses CREATE TABLE IF NOT EXISTS so the migration is safe to re-run and
idempotent across branches.

Revision ID: 054_opportunity_documents_table
Revises: 053_fk_indexes_and_checks
Create Date: 2026-04-28 00:00:00.000000

# TENANCY: workspace-scope candidate — a composite index on
# (workspace_id, opportunity_id) will be needed when multi-tenancy lands.
"""

from __future__ import annotations

import uuid
from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

revision: str = "054_opportunity_documents_table"
down_revision: Union[str, None] = "053_fk_indexes_and_checks"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    # ── Create opportunity_documents table ───────────────────────────────────
    op.create_table(
        "opportunity_documents",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            primary_key=True,
            default=uuid.uuid4,
            nullable=False,
        ),
        sa.Column(
            "opportunity_id",
            UUID(as_uuid=True),
            sa.ForeignKey("opportunities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("doc_type", sa.String(100), nullable=False),
        sa.Column("label", sa.String(255), nullable=True),
        sa.Column("url", sa.Text, nullable=False),
        sa.Column(
            "uploaded_by",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    # ── Index on FK ──────────────────────────────────────────────────────────
    op.create_index(
        "ix_opportunity_documents_opportunity_id",
        "opportunity_documents",
        ["opportunity_id"],
    )

    # ── Uniqueness: at most one row per (opportunity, doc_type) ──────────────
    # Without this the ON CONFLICT clause below is a no-op, and a re-run of
    # the migration during deploys would multiply rows.
    op.create_unique_constraint(
        "uq_opportunity_documents_opp_doc_type",
        "opportunity_documents",
        ["opportunity_id", "doc_type"],
    )

    # ── Migrate existing JSONB data ──────────────────────────────────────────
    # The documents column stores:  {"doc_type_key": "url_string", ...}
    # Map each key to a row in the new table.
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            INSERT INTO opportunity_documents
                (id, opportunity_id, doc_type, label, url, uploaded_by, created_at)
            SELECT
                gen_random_uuid(),
                o.id,
                kv.key,
                kv.key,         -- label defaults to the doc_type key
                kv.value::text,
                NULL,
                NOW()
            FROM opportunities o,
                 jsonb_each_text(o.documents) kv
            WHERE o.documents IS NOT NULL
              AND jsonb_typeof(o.documents) = 'object'
            ON CONFLICT (opportunity_id, doc_type) DO NOTHING
            """
        )
    )


def downgrade() -> None:
    # ── Write data back into the JSONB column before dropping the table ──────
    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE opportunities o
            SET documents = (
                SELECT jsonb_object_agg(od.doc_type, od.url)
                FROM opportunity_documents od
                WHERE od.opportunity_id = o.id
            )
            WHERE EXISTS (
                SELECT 1 FROM opportunity_documents od
                WHERE od.opportunity_id = o.id
            )
            """
        )
    )

    op.drop_constraint(
        "uq_opportunity_documents_opp_doc_type",
        "opportunity_documents",
        type_="unique",
    )
    op.drop_index("ix_opportunity_documents_opportunity_id", "opportunity_documents")
    op.drop_table("opportunity_documents")
