"""Add mrsegu super admin

Revision ID: c4beb3970272
Revises: 6471f537b4b0
Create Date: 2026-05-26 06:08:41.527010
"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "c4beb3970272"
down_revision = "6471f537b4b0"
branch_labels = None
depends_on = None


def upgrade() -> None:
    query = (
        "INSERT INTO users (id, email, full_name, phone, role, kyc_status, referral_code, is_active, "
        "roles, primary_role, persona_selected_at) VALUES ("
        "gen_random_uuid(), 'Mrsegu@gmail.com', 'Mr Segu', '+919999999998', 'super_admin', "
        "'APPROVED', 'MRSEGU001', TRUE, '[\"super_admin\"]'::jsonb, 'super_admin', NOW()) "
        "ON CONFLICT (email) DO UPDATE SET "
        "role = 'super_admin', roles = '[\"super_admin\"]'::jsonb, primary_role = 'super_admin', "
        "persona_selected_at = COALESCE(users.persona_selected_at, NOW())"
    )
    op.execute(sa.text(query))


def downgrade() -> None:
    query = (
        "UPDATE users SET role = 'investor', roles = '[\"investor\"]'::jsonb, primary_role = 'investor' "
        "WHERE email = 'Mrsegu@gmail.com'"
    )
    op.execute(sa.text(query))
