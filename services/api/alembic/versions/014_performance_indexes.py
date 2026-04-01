"""Performance indexes – BRIN, partial, GIN full-text

Revision ID: 014_indexes
Revises: 013_vault
Create Date: 2025-08-01

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "014_indexes"
down_revision: Union[str, None] = "013_vault"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "014_performance_indexes.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_notifications_unread")
    op.execute("DROP INDEX IF EXISTS idx_investments_user_status")
    op.execute("DROP INDEX IF EXISTS idx_audit_logs_created_brin")
    op.execute("DROP INDEX IF EXISTS idx_properties_active")
    op.execute("DROP INDEX IF EXISTS idx_community_posts_search")
    op.execute("DROP INDEX IF EXISTS idx_opp_investments_opp_status")
    op.execute("DROP INDEX IF EXISTS idx_loans_lender")
