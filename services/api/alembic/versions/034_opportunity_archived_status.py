"""Add ARCHIVED status to opportunities for soft-delete

Revision ID: 034_opportunity_archived_status
Revises: 033_cms_seed
Create Date: 2026-04-14

The opportunities.status column uses native_enum=False (VARCHAR),
so no DDL change is needed — the new 'archived' value is handled
at the application layer.  This migration exists as a checkpoint.
"""

from typing import Sequence, Union
from alembic import op

revision: str = "034_opportunity_archived_status"
down_revision: Union[str, None] = "033_cms_seed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # No DDL needed — status is a VARCHAR column, new value handled by app
    pass


def downgrade() -> None:
    # Revert any archived opportunities back to 'closed'
    op.execute("UPDATE opportunities SET status = 'closed' WHERE status = 'archived'")
