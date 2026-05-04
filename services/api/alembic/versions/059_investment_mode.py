"""Add investment_mode column to opportunities table.

Stores whether an opportunity uses 'lumpsum' (builder enters target+min directly)
or 'unit_config' (target derived from unit/plot configuration rows).

Revision ID: 059_investment_mode
Revises: 058_eoi_form_options
Create Date: 2026-05-03 00:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "059_investment_mode"
down_revision: Union[str, None] = "058_eoi_form_options"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    op.add_column(
        "opportunities",
        sa.Column(
            "investment_mode",
            sa.String(20),
            nullable=True,
            server_default="lumpsum",
        ),
    )
    op.create_index(
        "ix_opportunities_investment_mode",
        "opportunities",
        ["investment_mode"],
    )


def downgrade() -> None:
    op.drop_index("ix_opportunities_investment_mode", table_name="opportunities")
    op.drop_column("opportunities", "investment_mode")
