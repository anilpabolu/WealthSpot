"""Opportunity media url + is_cover columns

Revision ID: 012_opp_media
Revises: 011_opp_cols
Create Date: 2025-07-28

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "012_opp_media"
down_revision: Union[str, None] = "011_opp_cols"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "012_opportunity_media_missing_columns.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    pass  # Column additions
