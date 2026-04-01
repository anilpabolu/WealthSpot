"""Opportunity address columns (idempotent re-add)

Revision ID: 011_opp_cols
Revises: 010_notif
Create Date: 2025-07-28

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "011_opp_cols"
down_revision: Union[str, None] = "010_notif"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "011_opportunity_missing_columns.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    pass  # Column additions via IF NOT EXISTS
