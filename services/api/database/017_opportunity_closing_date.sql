-- 017: Add closing_date column to opportunities
-- The model references closing_date but the column was never created.

ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS closing_date TIMESTAMPTZ;
