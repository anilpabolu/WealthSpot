"""Add vault_type column to companies table

Revision ID: 016_company_vault_type
Revises: 015_checks
Create Date: 2025-08-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "016_company_vault_type"
down_revision: Union[str, None] = "015_checks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "companies",
        sa.Column("vault_type", sa.String(20), nullable=True),
    )
    op.create_index("ix_companies_vault_type", "companies", ["vault_type"])


def downgrade() -> None:
    op.drop_index("ix_companies_vault_type", table_name="companies")
    op.drop_column("companies", "vault_type")
