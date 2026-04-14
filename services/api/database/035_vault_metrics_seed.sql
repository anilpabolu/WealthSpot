INSERT INTO platform_configs (id, section, key, value, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'vault_metrics', 'wealth_metrics', '{"metrics": ["total_invested","investor_count","expected_irr","actual_irr","properties_listed","min_investment"]}'::jsonb, 'Enabled metrics shown on the Wealth Vault card', true, NOW(), NOW()),
  (gen_random_uuid(), 'vault_metrics', 'opportunity_metrics', '{"metrics": ["total_invested","investor_count","expected_irr","actual_irr","startups_listed"]}'::jsonb, 'Enabled metrics shown on the Opportunity Vault card', true, NOW(), NOW()),
  (gen_random_uuid(), 'vault_metrics', 'community_metrics', '{"metrics": ["total_invested","investor_count","projects_launched","projects_successful","co_investors"]}'::jsonb, 'Enabled metrics shown on the Community Vault card', true, NOW(), NOW())
ON CONFLICT (section, key) DO NOTHING;

UPDATE alembic_version SET version_num = '035_vault_metrics_config';
