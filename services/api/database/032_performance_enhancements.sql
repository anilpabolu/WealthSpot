-- 032_performance_enhancements.sql
-- Additional indexes and constraints for query performance & data integrity

-- ── Missing indexes ─────────────────────────────────────────────────────────

-- Referral code lookups (used in apply-referral flow)
CREATE INDEX IF NOT EXISTS idx_referrals_code_used
ON referrals (code_used);

-- Audit log filtering by actor (admin audit trail queries)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
ON audit_logs (actor_id) WHERE actor_id IS NOT NULL;

-- User role-based queries (persona dashboards, admin filters)
CREATE INDEX IF NOT EXISTS idx_users_primary_role
ON users (primary_role);

-- Expression of interest by user (portfolio / dashboard queries)
CREATE INDEX IF NOT EXISTS idx_eoi_user_id
ON expressions_of_interest (user_id);

-- Opportunity investments by user (portfolio aggregation)
CREATE INDEX IF NOT EXISTS idx_opp_investments_user
ON opportunity_investments (user_id, status);

-- ── Phone uniqueness constraint ─────────────────────────────────────────────
-- First, deduplicate: keep the phone on the most-recently-updated user, NULL the rest
UPDATE users SET phone = NULL
WHERE phone IS NOT NULL AND phone != ''
  AND id NOT IN (
      SELECT DISTINCT ON (phone) id
      FROM users
      WHERE phone IS NOT NULL AND phone != ''
      ORDER BY phone, updated_at DESC NULLS LAST
  );

-- Partial unique index: only enforce uniqueness for non-empty phone numbers
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_unique
ON users (phone) WHERE phone IS NOT NULL AND phone != '';
