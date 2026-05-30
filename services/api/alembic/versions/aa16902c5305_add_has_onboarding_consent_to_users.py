"""add_has_onboarding_consent_to_users

Revision ID: aa16902c5305
Revises: 83740d25652a
Create Date: 2026-05-30 23:34:23.767448

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aa16902c5305"
down_revision: Union[str, None] = "83740d25652a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "has_onboarding_consent",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        ),
    )
    # Backfill: mark existing users who already accepted the consent popup
    op.execute("""
        UPDATE users
        SET has_onboarding_consent = TRUE
        WHERE id IN (
            SELECT DISTINCT user_id
            FROM consent_logs
            WHERE context IN ('ONBOARDING', 'LOGIN')
              AND regulatory_accepted = TRUE
              AND privacy_accepted    = TRUE
        )
    """)


def downgrade() -> None:
    op.drop_column("users", "has_onboarding_consent")
