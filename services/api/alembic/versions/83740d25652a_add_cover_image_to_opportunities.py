"""Add cover_image to opportunities

Revision ID: 83740d25652a
Revises: 7d518706f18b
Create Date: 2026-05-30 15:17:42.446774

"""

from collections.abc import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "83740d25652a"
down_revision: Union[str, None] = "7d518706f18b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS cover_image TEXT;")


def downgrade() -> None:
    pass
