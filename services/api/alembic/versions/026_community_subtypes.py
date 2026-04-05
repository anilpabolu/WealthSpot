"""Add community_subtype and community_details to opportunities

Revision ID: 026_community_subtypes
Revises: 025_profiling_enhancements
Create Date: 2026-04-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "026_community_subtypes"
down_revision: Union[str, None] = "025_profiling_enhancements"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── New columns on opportunities ───────────────────────────────────
    op.add_column(
        "opportunities",
        sa.Column("community_subtype", sa.String(20), nullable=True),
    )
    op.add_column(
        "opportunities",
        sa.Column("community_details", JSONB, nullable=True),
    )

    # CHECK constraint: only valid subtypes
    op.create_check_constraint(
        "ck_opportunities_community_subtype_values",
        "opportunities",
        "community_subtype IS NULL OR community_subtype IN ('co_investor', 'co_partner')",
    )

    # Partial index for fast filtering
    op.create_index(
        "idx_opportunities_community_subtype",
        "opportunities",
        ["community_subtype"],
        postgresql_where=sa.text("community_subtype IS NOT NULL"),
    )

    # Back-fill existing community opportunities as co_investor (sensible default)
    conn = op.get_bind()
    conn.exec_driver_sql(
        "UPDATE opportunities SET community_subtype = 'co_investor' WHERE vault_type = 'community'"
    )


def downgrade() -> None:
    op.drop_index("idx_opportunities_community_subtype", table_name="opportunities")
    op.drop_constraint("ck_opportunities_community_subtype_values", "opportunities")
    op.drop_column("opportunities", "community_details")
    op.drop_column("opportunities", "community_subtype")
