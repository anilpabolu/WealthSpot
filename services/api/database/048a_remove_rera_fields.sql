-- ============================================================================
-- WealthSpot – Migration 048a: Remove RERA fields globally
-- Hard-removes deprecated RERA columns from live tables.
-- ============================================================================

ALTER TABLE IF EXISTS builders
  DROP COLUMN IF EXISTS rera_number;

ALTER TABLE IF EXISTS companies
  DROP COLUMN IF EXISTS rera_number;

ALTER TABLE IF EXISTS properties
  DROP COLUMN IF EXISTS rera_id;
