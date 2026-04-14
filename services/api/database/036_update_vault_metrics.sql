UPDATE platform_configs SET value = '{"metrics":["total_invested","investor_count","properties_listed"]}'::jsonb, updated_at = NOW() WHERE section='vault_metrics' AND key='wealth_metrics';
UPDATE platform_configs SET value = '{"metrics":["total_invested","investor_count","startups_listed"]}'::jsonb, updated_at = NOW() WHERE section='vault_metrics' AND key='opportunity_metrics';
UPDATE platform_configs SET value = '{"metrics":["total_invested","investor_count","projects_launched","co_investors"]}'::jsonb, updated_at = NOW() WHERE section='vault_metrics' AND key='community_metrics';
