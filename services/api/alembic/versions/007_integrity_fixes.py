"""Integrity fixes – unique constraints, indexes, FK cascades

Revision ID: 007_integrity
Revises: 006_property
Create Date: 2025-07-20

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "007_integrity"
down_revision: Union[str, None] = "006_property"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "007_integrity_fixes.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    pass  # Constraint additions – drop manually if needed
