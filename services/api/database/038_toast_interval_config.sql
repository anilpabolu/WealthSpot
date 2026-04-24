-- Migration 038: Add toast_interval_ms to platform_configs
-- Stores the auto-dismiss duration (ms) for the global toast ribbon

INSERT INTO platform_configs (id, section, key, value, description, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'notifications',
    'toast_interval_ms',
    '3000'::jsonb,
    'Auto-dismiss interval in milliseconds for toast notifications',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (section, key) DO NOTHING;
