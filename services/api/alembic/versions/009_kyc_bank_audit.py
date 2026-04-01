"""KYC document fields, bank details (encrypted), audit log changes

Revision ID: 009_kyc_bank
Revises: 008_profile
Create Date: 2025-07-24

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "009_kyc_bank"
down_revision: Union[str, None] = "008_profile"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "009_kyc_bank_audit.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS bank_details CASCADE")
