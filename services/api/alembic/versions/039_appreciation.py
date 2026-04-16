"""Add current_valuation to opportunities and create appreciation_events table.

Revision ID: 039_appreciation
Revises: 038_project_phase
Create Date: 2026-04-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "039_appreciation"
down_revision = "038_project_phase"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add current_valuation to opportunities
    op.add_column(
        "opportunities",
        sa.Column("current_valuation", sa.Numeric(15, 2), nullable=True),
    )

    # Create appreciation_events table
    op.create_table(
        "appreciation_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "opportunity_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("opportunities.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("mode", sa.String(20), nullable=False),  # 'percentage' or 'absolute'
        sa.Column("input_value", sa.Numeric(15, 2), nullable=False),
        sa.Column("old_valuation", sa.Numeric(15, 2), nullable=False),
        sa.Column("new_valuation", sa.Numeric(15, 2), nullable=False),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_appreciation_events_opportunity_id",
        "appreciation_events",
        ["opportunity_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_appreciation_events_opportunity_id", "appreciation_events")
    op.drop_table("appreciation_events")
    op.drop_column("opportunities", "current_valuation")
