-- ============================================================================
-- 004 – Community Enhancements
-- • community_post_likes  (per-user idempotent likes for posts)
-- • community_reply_likes (per-user idempotent likes for replies)
-- • community_replies.is_approved + approval_request_id (question-answer flow)
-- • platform_configs entries for community word limits
-- ============================================================================

-- 1. Per-user post likes (unique per user per post)
CREATE TABLE IF NOT EXISTS community_post_likes (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id      UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id)           ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_post_likes_post   ON community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user   ON community_post_likes(user_id);

-- 2. Per-user reply likes
CREATE TABLE IF NOT EXISTS community_reply_likes (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reply_id     UUID NOT NULL REFERENCES community_replies(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES users(id)             ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (reply_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_reply_likes_reply ON community_reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_community_reply_likes_user  ON community_reply_likes(user_id);

-- 3. Add approval tracking to community_replies
--    is_approved=TRUE  → visible immediately (discussions)
--    is_approved=FALSE → pending approval  (question-answers)
ALTER TABLE community_replies
    ADD COLUMN IF NOT EXISTS is_approved        BOOLEAN   DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS approval_request_id UUID REFERENCES approval_requests(id) ON DELETE SET NULL;

-- Backfill existing replies as approved
UPDATE community_replies SET is_approved = TRUE WHERE is_approved IS NULL;

-- 4. Platform config – community word limits (section/key/value)
INSERT INTO platform_configs (section, key, value, description)
SELECT 'community', 'post_max_words', '300'::jsonb, 'Maximum word count for a community post body'
WHERE NOT EXISTS (SELECT 1 FROM platform_configs WHERE section = 'community' AND key = 'post_max_words');

INSERT INTO platform_configs (section, key, value, description)
SELECT 'community', 'post_min_words', '10'::jsonb, 'Minimum word count for a community post body'
WHERE NOT EXISTS (SELECT 1 FROM platform_configs WHERE section = 'community' AND key = 'post_min_words');
