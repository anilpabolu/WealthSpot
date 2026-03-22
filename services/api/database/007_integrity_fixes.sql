-- 007_integrity_fixes.sql
-- Fix enum mismatches, add unique constraints, add performance indexes
-- Run AFTER all previous migrations (001-006)

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. Fix user_role enum – add missing roles if using native PG enum
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    -- Only add values if the enum type exists (native enum)
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'founder'; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'community_lead'; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'approver'; EXCEPTION WHEN duplicate_object THEN NULL; END;
        BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin'; EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. Unique constraints to prevent duplicate likes
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_post_like_user') THEN
        -- Remove any existing duplicates first
        DELETE FROM community_post_likes a
        USING community_post_likes b
        WHERE a.id > b.id
          AND a.post_id = b.post_id
          AND a.user_id = b.user_id;

        ALTER TABLE community_post_likes
            ADD CONSTRAINT uq_post_like_user UNIQUE (post_id, user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_reply_like_user') THEN
        DELETE FROM community_reply_likes a
        USING community_reply_likes b
        WHERE a.id > b.id
          AND a.reply_id = b.reply_id
          AND a.user_id = b.user_id;

        ALTER TABLE community_reply_likes
            ADD CONSTRAINT uq_reply_like_user UNIQUE (reply_id, user_id);
    END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- 3. Performance indexes for common query patterns
-- ═══════════════════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_properties_created_at
    ON properties (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_properties_status_created
    ON properties (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_created_at
    ON community_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id
    ON community_posts (user_id);

CREATE INDEX IF NOT EXISTS idx_investments_status
    ON investments (status);

CREATE INDEX IF NOT EXISTS idx_investments_user_status
    ON investments (user_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
    ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status
    ON approval_requests (status);

CREATE INDEX IF NOT EXISTS idx_approval_requests_category_status
    ON approval_requests (category, status);

CREATE INDEX IF NOT EXISTS idx_opportunities_vault_status
    ON opportunities (vault_type, status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_loans_lender_status
    ON loans (lender_id, status);


-- ═══════════════════════════════════════════════════════════════════════════
-- 4. Add missing cascade rules
-- ═══════════════════════════════════════════════════════════════════════════
-- Opportunities -> Company: SET NULL on delete (don't lose opportunities if company removed)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'opportunities_company_id_fkey'
          AND table_name = 'opportunities'
    ) THEN
        ALTER TABLE opportunities DROP CONSTRAINT opportunities_company_id_fkey;
        ALTER TABLE opportunities ADD CONSTRAINT opportunities_company_id_fkey
            FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMIT;
