"""Create builder_update_reads table for read-receipt tracking.

Tracks which investor has read which builder update, enabling
per-user unread-count badges on the portfolio holdings table.

Revision ID: 060_builder_update_reads
Revises: 059_investment_mode
Create Date: 2026-05-03 00:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "060_builder_update_reads"
down_revision: Union[str, None] = "059_investment_mode"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.create_table(
        "builder_update_reads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "update_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("builder_updates.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "read_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_builder_update_reads_user_id", "builder_update_reads", ["user_id"])
    op.create_index("ix_builder_update_reads_update_id", "builder_update_reads", ["update_id"])
    op.create_unique_constraint(
        "uq_builder_update_reads_user_update",
        "builder_update_reads",
        ["user_id", "update_id"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_builder_update_reads_user_update", "builder_update_reads", type_="unique")
    op.drop_index("ix_builder_update_reads_update_id", table_name="builder_update_reads")
    op.drop_index("ix_builder_update_reads_user_id", table_name="builder_update_reads")
    op.drop_table("builder_update_reads")
