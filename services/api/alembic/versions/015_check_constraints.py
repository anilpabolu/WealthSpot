"""CHECK constraints on financial columns

Revision ID: 015_checks
Revises: 014_indexes
Create Date: 2025-08-01

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "015_checks"
down_revision: Union[str, None] = "014_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "015_check_constraints.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    op.execute("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transactions_amount_positive")
    op.execute("ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loans_principal_positive")
    op.execute("ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loans_interest_rate_positive")
    op.execute("ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loans_tenure_positive")
