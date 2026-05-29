"""fix mrsegu super admin

Revision ID: fcd1a26e9ea0
Revises: 2c5529d18a28
Create Date: 2026-05-29 20:24:29.372663

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "fcd1a26e9ea0"
down_revision: Union[str, None] = "2c5529d18a28"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    query = """
    -- 1. Delete the broken uppercase duplicate that was erroneously created in previous migrations
    DELETE FROM users WHERE email = 'Mrsegu@gmail.com';

    -- 2. Upsert the correct lowercase email to ensure they have super_admin capabilities
    --    This preserves their existing data (clerk_id, investments) if they've already signed in
    INSERT INTO users (id, email, full_name, phone, role, kyc_status, referral_code, is_active,
                       roles, primary_role, persona_selected_at)
    VALUES (
        gen_random_uuid(),
        'mrsegu@gmail.com',
        'Mr Segu',
        '+919999999998',
        'super_admin',
        'APPROVED',
        'MRSEGU002',
        TRUE,
        '["super_admin"]'::jsonb,
        'super_admin',
        NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
        role              = 'super_admin',
        roles             = '["super_admin"]'::jsonb,
        primary_role      = 'super_admin',
        persona_selected_at = COALESCE(users.persona_selected_at, NOW());
    """
    op.execute(sa.text(query))


def downgrade() -> None:
    query = """
    UPDATE users SET role = 'investor', roles = '["investor"]'::jsonb, primary_role = 'investor'
    WHERE email = 'mrsegu@gmail.com';
    """
    op.execute(sa.text(query))
