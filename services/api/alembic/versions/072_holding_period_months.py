"""add holding_period_months to opportunities

Revision ID: 072_holding_period_months
Revises: 071_project_roadmap_thesis
Create Date: 2026-06-04 16:00:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "072_holding_period_months"
down_revision: Union[str, None] = "071_project_roadmap_thesis"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "opportunities",
        sa.Column("holding_period_months", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("opportunities", "holding_period_months")
