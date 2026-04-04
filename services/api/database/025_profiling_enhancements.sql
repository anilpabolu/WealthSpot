-- 025: Add archetype columns and seed additional profiling questions
-- Run after 024_profiling_matching.sql

-- ── Schema changes ─────────────────────────────────────────────────
ALTER TABLE personality_dimensions ADD COLUMN IF NOT EXISTS archetype_label VARCHAR(50);
ALTER TABLE personality_dimensions ADD COLUMN IF NOT EXISTS archetype_description TEXT;
ALTER TABLE profile_match_scores ADD COLUMN IF NOT EXISTS archetype_compatibility VARCHAR(50);

-- ── Seed additional profiling questions ─────────────────────────────
-- WEALTH VAULT (4 new, sort_order 7-10)
-- COMMUNITY VAULT (2 new, sort_order 9-10)
-- OPPORTUNITY VAULT (6 new, sort_order 5-10)
-- See alembic/versions/025_profiling_enhancements.py for full INSERT statements
