"""CMS seed data for newly CMS-enabled pages

Revision ID: 033_cms_seed
Revises: 032_performance
Create Date: 2026-04-14
"""

from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "033_cms_seed"
down_revision: Union[str, None] = "032_performance"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "033_cms_content_seed.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    pass
