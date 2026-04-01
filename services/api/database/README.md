# Database Scripts

This directory contains standalone SQL scripts for WealthSpot's PostgreSQL database.
Each SQL file has a corresponding Alembic migration in `../alembic/versions/` that
reads and executes it, maintaining a single source of truth.

## Files

| File | Purpose |
|------|---------|
| `001_initial_schema.sql` | Full DDL: enums, 10 tables, indexes, constraints, triggers |
| `002_seed_data.sql` | Realistic dev/demo data (6 users, 4 properties, investments, etc.) |
| `003_rbac_approvals_opportunities.sql` | RBAC, approvals, opportunities, platform configs |
| `004_community_enhancements.sql` | Post/reply likes, reply approval flow |
| `005_companies_pincodes_points_groups.sql` | Companies, pincodes, points, groups, notifications |
| `005b_media_address_company.sql` | Media, address, company overlays |
| `006_property_enhancements.sql` | Property highlights, fuzzy search, builder fields |
| `007_integrity_fixes.sql` | Unique constraints, indexes, FK cascades |
| `008_user_profile_completion.sql` | 26+ user profile columns |
| `009_kyc_bank_audit.sql` | KYC documents, bank details, audit changes |
| `010_notification_preferences.sql` | Notification preferences, read_at |
| `011_opportunity_missing_columns.sql` | Opportunity address columns |
| `012_opportunity_media_missing_columns.sql` | Opportunity media url/is_cover |
| `013_vault_stats_irr_approval_edit.sql` | Vault stats, IRR, opportunity_investments |
| `014_performance_indexes.sql` | BRIN, partial, GIN full-text indexes |
| `015_check_constraints.sql` | CHECK constraints on financial columns |

## Recommended: Use Alembic

```bash
cd services/api
alembic upgrade head     # applies all migrations via alembic/versions/
```

## Alternative: Apply SQL Directly (dev/docker setup)

```bash
# Start PostgreSQL via Docker Compose (from project root)
docker compose up -d postgres

# Apply schema + seed
docker compose exec -T postgres psql -U wealthspot -d wealthspot < services/api/database/001_initial_schema.sql
docker compose exec -T postgres psql -U wealthspot -d wealthspot < services/api/database/002_seed_data.sql
```

## Notes

- Requires PostgreSQL 16+ with `uuid-ossp` and `pgcrypto` extensions.
- `updated_at` columns are auto-managed by triggers.
- Seed data uses deterministic UUIDs (`a0000000-…`, `b0000000-…`, etc.) for easy cross-referencing.
