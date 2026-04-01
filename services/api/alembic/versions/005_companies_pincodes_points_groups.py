"""Companies, Pincodes, Points, Groups, Notifications, Opportunity Media

Revision ID: 005_companies
Revises: 004_community
Create Date: 2025-07-16

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "005_companies"
down_revision: Union[str, None] = "004_community"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "005_companies_pincodes_points_groups.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS group_messages CASCADE")
    op.execute("DROP TABLE IF EXISTS role_groups CASCADE")
    op.execute("DROP TABLE IF EXISTS user_points CASCADE")
    op.execute("DROP TABLE IF EXISTS opportunity_media CASCADE")
    op.execute("DROP TABLE IF EXISTS notifications CASCADE")
    op.execute("DROP TABLE IF EXISTS indian_pincodes CASCADE")
    op.execute("DROP TABLE IF EXISTS companies CASCADE")
