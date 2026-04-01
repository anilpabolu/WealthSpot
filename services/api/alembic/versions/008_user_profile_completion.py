"""User profile completion – 26+ columns for risk, address, OTP, bio

Revision ID: 008_profile
Revises: 007_integrity
Create Date: 2025-07-22

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "008_profile"
down_revision: Union[str, None] = "007_integrity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "008_user_profile_completion.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    pass  # Column additions – not easily reversible
