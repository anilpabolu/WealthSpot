"""add source_clicks table

Revision ID: 073_source_clicks
Revises: 072_holding_period_months
Create Date: 2026-06-05 01:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "073_source_clicks"
down_revision: Union[str, None] = "072_holding_period_months"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "source_clicks",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "source_type",
            sa.String(20),
            nullable=False,
            index=True,
            comment="Category: 'vault' or 'opportunity'",
        ),
        sa.Column(
            "source_id",
            sa.String(100),
            nullable=False,
            index=True,
            comment="Vault slug or opportunity UUID",
        ),
        sa.Column(
            "click_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
            comment="Auto-incremented visit counter",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("source_type", "source_id", name="uq_source_click_type_id"),
    )


def downgrade() -> None:
    op.drop_table("source_clicks")
