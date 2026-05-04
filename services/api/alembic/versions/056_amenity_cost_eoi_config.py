"""Add amenity_cost_estimate to opportunities and selected_unit_config to expressions_of_interest.

Revision ID: 056_amenity_cost_eoi_config
Revises: 055_user_devices
Create Date: 2026-05-01 10:00:00.000000
"""

from __future__ import annotations

from typing import Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

from alembic import op

revision: str = "056_amenity_cost_eoi_config"
down_revision: Union[str, None] = "055_user_devices"
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def upgrade() -> None:
    # Add combined amenity cost estimate to listings (e.g. ₹50,000 per unit)
    op.add_column(
        "opportunities",
        sa.Column("amenity_cost_estimate", sa.Numeric(15, 2), nullable=True),
    )
    # Track which BHK / unit configuration the investor is interested in
    op.add_column(
        "expressions_of_interest",
        sa.Column("selected_unit_config", JSONB(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("expressions_of_interest", "selected_unit_config")
    op.drop_column("opportunities", "amenity_cost_estimate")
