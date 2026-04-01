"""RBAC, Approvals, Opportunities, Platform Config

Revision ID: 003_rbac
Revises: 001_initial
Create Date: 2025-07-12

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "003_rbac"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "003_rbac_approvals_opportunities.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS platform_configs CASCADE")
    op.execute("DROP TABLE IF EXISTS opportunities CASCADE")
    op.execute("DROP TABLE IF EXISTS approval_requests CASCADE")
