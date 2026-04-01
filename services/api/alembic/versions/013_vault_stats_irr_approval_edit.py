"""Vault stats, IRR columns, opportunity_investments table

Revision ID: 013_vault
Revises: 012_opp_media
Create Date: 2025-07-30

"""
from typing import Sequence, Union
from pathlib import Path

from sql_utils import exec_sql_file

revision: str = "013_vault"
down_revision: Union[str, None] = "012_opp_media"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SQL_FILE = Path(__file__).resolve().parents[2] / "database" / "013_vault_stats_irr_approval_edit.sql"


def upgrade() -> None:
    exec_sql_file(_SQL_FILE)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS opportunity_investments CASCADE")
