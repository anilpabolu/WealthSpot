-- Migration 014: Rebrand "Opportunity Vault" → "Safe Vault"
--
-- Changes:
--   1. Rename vault_type value 'opportunity' → 'safe' in opportunities table
--   2. Add safe_vault_data JSONB column for per-project Safe Vault configuration
--   3. Update vault_metrics_config references if any
--   4. Update any seed/config tables tracking vault types

-- Step 1: Expand the allowed vault_type values by removing old CHECK constraint
--         (SQLAlchemy native_enum=False uses VARCHAR; no CHECK exists, update data directly)

-- Rename existing opportunity vault_type rows
UPDATE opportunities
SET vault_type = 'safe'
WHERE vault_type = 'opportunity';

-- Step 2: Add safe_vault_data JSONB column
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS safe_vault_data JSONB;

-- Step 3: Update vault_metrics_config if vault_type column exists there
UPDATE vault_metrics_config
SET vault_type = 'safe'
WHERE vault_type = 'opportunity';

-- Step 4: Update platform_config keys that stored vault-type strings in JSON arrays/values
--         The config key 'opportunity_vault_enabled' is left as-is (feature flag, separate concern).
--         Only rename vault_type data values.

-- Step 5: Update any stored vault_type references in vault_stats or analytics tables if present
UPDATE vault_stats
SET vault_type = 'safe'
WHERE vault_type = 'opportunity';
