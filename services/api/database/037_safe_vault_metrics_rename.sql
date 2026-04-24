-- Migration 037: Rename opportunity_metrics → safe_metrics to match vault rebrand
-- Also seeds richer default metrics for all three vaults

UPDATE platform_configs
SET key = 'safe_metrics',
    value = '{"metrics":["total_invested","investor_count","explorer_count","platform_users","listings_count","avg_interest_rate","avg_tenure_months","cities_covered","min_investment","mortgage_coverage_pct"]}'::jsonb,
    updated_at = NOW()
WHERE section = 'vault_metrics' AND key = 'opportunity_metrics';

-- Update wealth metrics to include richer defaults
UPDATE platform_configs
SET value = '{"metrics":["total_invested","investor_count","explorer_count","platform_users","properties_listed","min_investment","cities_covered","expected_irr","actual_irr","avg_ticket_size"]}'::jsonb,
    updated_at = NOW()
WHERE section = 'vault_metrics' AND key = 'wealth_metrics';

-- Update community metrics with richer defaults
UPDATE platform_configs
SET value = '{"metrics":["total_invested","investor_count","explorer_count","platform_users","projects_launched","co_investors","co_partners","cities_covered"]}'::jsonb,
    updated_at = NOW()
WHERE section = 'vault_metrics' AND key = 'community_metrics';

-- Insert safe_metrics row if it doesn't exist yet (for fresh installs)
INSERT INTO platform_configs (id, section, key, value, description, is_active, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'vault_metrics',
    'safe_metrics',
    '{"metrics":["total_invested","investor_count","explorer_count","platform_users","listings_count","avg_interest_rate","avg_tenure_months","cities_covered","min_investment","mortgage_coverage_pct"]}'::jsonb,
    'Enabled metrics shown on the Safe Vault card',
    true,
    NOW(),
    NOW()
)
ON CONFLICT (section, key) DO NOTHING;
