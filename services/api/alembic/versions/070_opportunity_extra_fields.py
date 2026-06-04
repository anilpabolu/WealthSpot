"""add opportunity extra fields

Revision ID: 070_opportunity_extra_fields
Revises: 069_founding_team
Create Date: 2026-06-04 15:05:00.000000

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "070_opportunity_extra_fields"
down_revision: Union[str, None] = "069_founding_team"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "opportunities", sa.Column("development_type", sa.String(length=100), nullable=True)
    )
    op.add_column(
        "opportunities",
        sa.Column("gst_percentage", sa.Numeric(precision=5, scale=2), nullable=True),
    )
    op.add_column(
        "opportunities",
        sa.Column(
            "projected_market_value_at_exit", sa.Numeric(precision=15, scale=2), nullable=True
        ),
    )
    op.add_column("opportunities", sa.Column("purpose_of_funds", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("opportunities", "purpose_of_funds")
    op.drop_column("opportunities", "projected_market_value_at_exit")
    op.drop_column("opportunities", "gst_percentage")
    op.drop_column("opportunities", "development_type")
