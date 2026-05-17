-- 049_phase1_nonbreaking_hardening.sql
--
-- Phase 1 (non-breaking): additive performance and integrity hardening.
-- This migration intentionally avoids destructive DDL.

-- ------------------------------------------------------------
-- Composite indexes for common filtering/query paths
-- ------------------------------------------------------------

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_vault_status
ON opportunities (vault_type, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_eoi_opportunity_status
ON expressions_of_interest (opportunity_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_upa_user_vault
ON user_profile_answers (user_id, vault_type);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vpq_vault_active_sort
ON vault_profile_questions (vault_type, is_active, sort_order);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_investments_user_status
ON opportunity_investments (user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opportunities_closing_date
ON opportunities (closing_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_launch_date
ON properties (launch_date DESC);

-- ------------------------------------------------------------
-- Additive CHECK constraints (NOT VALID)
--
-- Using NOT VALID keeps existing rows untouched while protecting new writes.
-- Validation can be executed later after data backfill/cleanup.
-- ------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('public.opportunities') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'chk_opportunities_target_amount_positive'
     )
  THEN
    ALTER TABLE opportunities
      ADD CONSTRAINT chk_opportunities_target_amount_positive
      CHECK (target_amount > 0) NOT VALID;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.opportunity_investments') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'chk_opp_investments_amount_positive'
     )
  THEN
    ALTER TABLE opportunity_investments
      ADD CONSTRAINT chk_opp_investments_amount_positive
      CHECK (amount > 0) NOT VALID;
  END IF;
END $$;
