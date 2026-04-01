"""Notification preferences, read_at timestamp, file_size bigint fix

Revision ID: 010_notif
Revises: 009_kyc_bank
Create Date: 2025-07-26

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "010_notif"
down_revision: Union[str, None] = "009_kyc_bank"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "010_notification_preferences.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    pass  # Column additions
