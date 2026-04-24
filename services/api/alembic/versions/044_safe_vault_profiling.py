"""Add Safe Vault profiling questions.

Revision ID: 044_safe_vault_profiling
Revises: 043_analytics_fixes
Create Date: 2026-04-23

Changes:
- Soft-delete legacy vault_type=''opportunity'' questions (rebranded to safe in migration 014)
- Insert 10 Safe Vault-specific fixed income profiling questions across 3 categories
"""

from typing import Sequence, Union
from pathlib import Path

from alembic import op

revision: str = "044_safe_vault_profiling"
down_revision: Union[str, None] = "043_analytics_fixes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    sql_path = Path(__file__).parent.parent.parent / "database" / "044_safe_vault_profiling.sql"
    sql = sql_path.read_text(encoding="utf-8")
    # Strip BEGIN/COMMIT — alembic manages the transaction, then run each
    # statement with exec_driver_sql so JSON payload colons are not treated
    # as bind parameters by SQLAlchemy.
    sql = sql.replace("BEGIN;", "").replace("COMMIT;", "")
    bind = op.get_bind()
    for statement in sql.split(";"):
        statement = statement.strip()
        if statement:
            bind.exec_driver_sql(statement)


def downgrade() -> None:
    op.execute("DELETE FROM vault_profile_questions WHERE vault_type = 'safe'")
    op.execute("UPDATE vault_profile_questions SET is_active = true WHERE vault_type = 'opportunity' AND is_active = false")
