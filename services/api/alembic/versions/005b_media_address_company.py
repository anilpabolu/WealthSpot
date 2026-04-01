"""Media, Address, Company additions (005b overlay)

Revision ID: 005b_media
Revises: 005_companies
Create Date: 2025-07-16

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "005b_media"
down_revision: Union[str, None] = "005_companies"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "005b_media_address_company.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    pass  # Overlay migration – columns added via IF NOT EXISTS
