"""Performance indexes and phone uniqueness constraint

Revision ID: 032_performance
Revises: 031_persona_seeding
Create Date: 2026-04-14
"""

from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "032_performance"
down_revision: Union[str, None] = "031_persona_seeding"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "032_performance_enhancements.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    from alembic import op
    op.execute("DROP INDEX IF EXISTS idx_referrals_code_used")
    op.execute("DROP INDEX IF EXISTS idx_audit_logs_actor")
    op.execute("DROP INDEX IF EXISTS idx_users_primary_role")
    op.execute("DROP INDEX IF EXISTS idx_eoi_user_id")
    op.execute("DROP INDEX IF EXISTS idx_opp_investments_user")
    op.execute("DROP INDEX IF EXISTS idx_users_phone_unique")
