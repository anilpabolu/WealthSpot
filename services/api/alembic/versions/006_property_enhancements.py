"""Property enhancements – highlights, fuzzy search, builder fields

Revision ID: 006_property
Revises: 005b_media
Create Date: 2025-07-18

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "006_property"
down_revision: Union[str, None] = "005b_media"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "006_property_enhancements.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    pass  # Column additions – not easily reversible
