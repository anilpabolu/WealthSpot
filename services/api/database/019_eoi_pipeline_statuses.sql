-- 019: Add EOI pipeline statuses for deal tracking
-- New statuses: deal_in_progress, payment_done, deal_completed

-- The status column uses a VARCHAR check, not a native enum, so we just need to
-- update the check constraint (if any) or it's already flexible since we use
-- native_enum=False in SQLAlchemy.

-- Add referrer_id to EOI for tracking who referred the user
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expressions_of_interest' AND column_name = 'referrer_id'
    ) THEN
        ALTER TABLE expressions_of_interest
            ADD COLUMN referrer_id UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Index for pipeline queries
CREATE INDEX IF NOT EXISTS idx_eoi_status ON expressions_of_interest(status);
CREATE INDEX IF NOT EXISTS idx_eoi_opportunity_status ON expressions_of_interest(opportunity_id, status);
