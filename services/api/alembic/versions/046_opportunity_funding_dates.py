"""Add funding_open_at to opportunities.

Revision ID: 046_opportunity_funding_dates
Revises: 045_safe_listing_category
Create Date: 2026-04-24
"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa
from alembic import op

revision: str = "046_opportunity_funding_dates"
down_revision: Union[str, None] = "045_safe_listing_category"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "opportunities",
        sa.Column("funding_open_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("opportunities", "funding_open_at")
