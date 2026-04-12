-- 026: Vault feature flags
-- Adds PlatformConfig rows to control which vaults are enabled/disabled.
-- Wealth Vault is always enabled (no row needed — defaults to true).
-- Opportunity and Community vaults start disabled (matching current behavior).

INSERT INTO platform_configs (id, section, key, value, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'vaults', 'opportunity_vault_enabled', '{"enabled": false}'::jsonb,
   'Toggle Opportunity Vault availability platform-wide', true, now(), now()),
  (gen_random_uuid(), 'vaults', 'community_vault_enabled', '{"enabled": false}'::jsonb,
   'Toggle Community Vault availability platform-wide', true, now(), now())
ON CONFLICT DO NOTHING;
