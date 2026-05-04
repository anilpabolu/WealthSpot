-- Migration 048: Add company_form required_fields config
-- Controls which fields are mandatory in the company onboarding form.
-- Default: contact name, email, and phone are required.
-- Configurable by super_admin via Command Control → Admin Settings.

INSERT INTO platform_configs (id, section, key, value, description, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'company_form',
    'required_fields',
    '["contactName", "contactEmail", "contactPhone"]'::jsonb,
    'Fields that are mandatory in the company onboarding form. Supported values: contactName, contactEmail, contactPhone, addressLine1, city, state, pincode',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (section, key) DO NOTHING;
