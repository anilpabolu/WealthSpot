-- ═══════════════════════════════════════════════════════════════════════════
-- 030_persona_seeding.sql
-- Seed kmrpab@gmail.com as super_admin and default all other users to
-- investor persona so the select-persona screen doesn't re-appear for
-- existing users.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Ensure kmrpab@gmail.com exists and is super_admin
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
    persona_selected_at = COALESCE(users.persona_selected_at, NOW());

-- 2. Default all other users without persona_selected_at to investor
UPDATE users
SET roles              = jsonb_build_array(role::text),
    primary_role       = role::text,
    persona_selected_at = NOW()
WHERE persona_selected_at IS NULL
  AND email != 'kmrpab@gmail.com';

COMMIT;
