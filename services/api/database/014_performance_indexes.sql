-- 014_performance_indexes.sql
-- Add missing indexes identified in production readiness review

-- Unread notifications (frequent query: unread count per user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_unread
ON notifications (user_id) WHERE read_at IS NULL;

-- Investment lookup by user + status (dashboard summary)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_investments_user_status
ON investments (user_id, status);

-- Audit logs by time range (BRIN index for time-series data)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_created_brin
ON audit_logs USING BRIN (created_at);

-- Active properties for marketplace (excludes archived/rejected)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_active
ON properties (city, asset_type) WHERE status NOT IN ('archived', 'rejected');

-- Community posts full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_posts_search
ON community_posts USING GIN (to_tsvector('english', title || ' ' || body));

-- Opportunity investments by opportunity + status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_opp_investments_opp_status
ON opportunity_investments (opportunity_id, status);

-- Loans by lender (lender dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loans_lender
ON loans (lender_id, status);
