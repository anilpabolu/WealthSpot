"""lowercase all existing emails

Revision ID: 7d518706f18a
Revises: fcd1a26e9ea0
Create Date: 2026-05-29 20:38:00.025532

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7d518706f18a"
down_revision: Union[str, None] = "fcd1a26e9ea0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    query1 = """
    -- Lowercase all admin_invites emails safely
    UPDATE admin_invites
    SET email = LOWER(email)
    WHERE email != LOWER(email)
      AND NOT EXISTS (
          SELECT 1 FROM admin_invites a2
          WHERE a2.email = LOWER(admin_invites.email)
      );
    """
    op.execute(sa.text(query1))

    query2 = """
    -- Lowercase all users emails safely
    UPDATE users
    SET email = LOWER(email)
    WHERE email != LOWER(email)
      AND NOT EXISTS (
          SELECT 1 FROM users u2
          WHERE u2.email = LOWER(users.email)
      );
    """
    op.execute(sa.text(query2))


def downgrade() -> None:
    pass
