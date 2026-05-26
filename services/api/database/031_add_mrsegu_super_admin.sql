-- 031_add_mrsegu_super_admin.sql
-- Add Mrsegu@gmail.com as super_admin, mirroring kmrpab@gmail.com logic

BEGIN;

INSERT INTO users (id, email, full_name, phone, role, kyc_status, referral_code, is_active,
                   roles, primary_role, persona_selected_at)
VALUES (
    gen_random_uuid(),
    'Mrsegu@gmail.com',
    'Mr Segu',
    '+919999999998',
    'super_admin',
    'APPROVED',
    'MRSEGU001',
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

COMMIT;
