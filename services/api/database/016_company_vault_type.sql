-- 016: Add vault_type column to companies table
-- Links companies to a specific vault (wealth / opportunity / community)

ALTER TABLE companies ADD COLUMN IF NOT EXISTS vault_type VARCHAR(20);
CREATE INDEX IF NOT EXISTS ix_companies_vault_type ON companies (vault_type);
