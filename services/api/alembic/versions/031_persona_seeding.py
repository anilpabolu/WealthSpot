"""Seed kmrpab@gmail.com as super_admin and default existing users to investor persona

Revision ID: 031_persona_seeding
Revises: 030_personas_vff
Create Date: 2026-04-14
"""

import sqlalchemy as sa
from alembic import op

revision = "031_persona_seeding"
down_revision = "030_personas_vff"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Ensure kmrpab@gmail.com exists and is super_admin
    op.execute(sa.text("""
        INSERT INTO users (id, email, full_name, phone, role, kyc_status, referral_code, is_active,
                           roles, primary_role, persona_selected_at)
        VALUES (
            gen_random_uuid(),
            'kmrpab@gmail.com',
            'KMR PAB',
            '+919999999999',
            'super_admin',
            'APPROVED',
            'KMRSA001',
            TRUE,
            '["super_admin"]'::jsonb,
            'super_admin',
            NOW()
        )
        ON CONFLICT (email) DO UPDATE SET
            role              = 'super_admin',
            roles             = '["super_admin"]'::jsonb,
            primary_role      = 'super_admin',
            persona_selected_at = COALESCE(users.persona_selected_at, NOW())
    """))

    # 2. Default all other users without persona_selected_at to investor
    op.execute(sa.text("""
        UPDATE users
        SET roles              = jsonb_build_array(role::text),
            primary_role       = role::text,
            persona_selected_at = NOW()
        WHERE persona_selected_at IS NULL
          AND email != 'kmrpab@gmail.com'
    """))


def downgrade() -> None:
    # Reset persona_selected_at for seeded users (non-destructive)
    op.execute(sa.text("""
        UPDATE users SET persona_selected_at = NULL
        WHERE email = 'kmrpab@gmail.com'
    """))
