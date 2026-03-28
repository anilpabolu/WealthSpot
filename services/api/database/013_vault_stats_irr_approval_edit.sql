-- ============================================================================
-- WealthSpot – Migration 013: Vault Stats, Expected/Actual IRR, Opportunity
--   Investments linking, Approval Edit support
-- ============================================================================

-- 1. Add expected_irr and actual_irr columns to opportunities table
--    expected_irr = what's projected at creation (replaces display-only target_irr role)
--    actual_irr   = computed/stored from real investment returns
ALTER TABLE opportunities
    ADD COLUMN IF NOT EXISTS expected_irr NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS actual_irr   NUMERIC(5,2);

-- Backfill: copy existing target_irr into expected_irr
UPDATE opportunities SET expected_irr = target_irr WHERE expected_irr IS NULL AND target_irr IS NOT NULL;

-- 2. Create opportunity_investments table to link investments to opportunities
--    This enables vault-level aggregations (total invested, investor count, returns)
CREATE TABLE IF NOT EXISTS opportunity_investments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount          NUMERIC(15,2) NOT NULL,
    units           INTEGER NOT NULL DEFAULT 1,
    status          VARCHAR(30) NOT NULL DEFAULT 'confirmed',
    returns_amount  NUMERIC(15,2) DEFAULT 0,
    invested_at     TIMESTAMPTZ DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_investments_opportunity ON opportunity_investments(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_investments_user ON opportunity_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_opp_investments_status ON opportunity_investments(status);

COMMENT ON TABLE opportunity_investments IS 'Links investments to specific opportunities for vault-level aggregation';

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_opportunity_investments
    BEFORE UPDATE ON opportunity_investments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 3. Add video_url column to opportunities if missing (may have been added in prior migration)
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 4. Add address detail columns if missing
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Index for company_id if not exists
CREATE INDEX IF NOT EXISTS idx_opportunities_company ON opportunities(company_id);
