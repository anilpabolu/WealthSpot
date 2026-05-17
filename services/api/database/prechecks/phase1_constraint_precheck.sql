-- phase1_constraint_precheck.sql
--
-- Read-only pre-validation report for Phase 1 NOT VALID constraints
-- introduced in 049_phase1_nonbreaking_hardening.sql.
--
-- Usage example:
-- psql -U wealthspot -d wealthspot -f services/api/database/prechecks/phase1_constraint_precheck.sql

\echo '=== Precheck: opportunities.target_amount <= 0 ==='
SELECT
  COUNT(*) AS bad_rows,
  COALESCE(MIN(target_amount), 0) AS min_target_amount,
  COALESCE(MAX(target_amount), 0) AS max_target_amount
FROM opportunities
WHERE target_amount <= 0;

\echo '=== Sample bad opportunity rows (up to 25) ==='
SELECT id, slug, title, target_amount, status, created_at
FROM opportunities
WHERE target_amount <= 0
ORDER BY created_at DESC
LIMIT 25;

\echo '=== Precheck: opportunity_investments.amount <= 0 ==='
SELECT
  COUNT(*) AS bad_rows,
  COALESCE(MIN(amount), 0) AS min_amount,
  COALESCE(MAX(amount), 0) AS max_amount
FROM opportunity_investments
WHERE amount <= 0;

\echo '=== Sample bad investment rows (up to 25) ==='
SELECT id, opportunity_id, user_id, amount, status, created_at
FROM opportunity_investments
WHERE amount <= 0
ORDER BY created_at DESC
LIMIT 25;
