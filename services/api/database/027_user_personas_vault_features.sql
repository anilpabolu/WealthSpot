-- Migration 027: User Personas, Vault-Feature Flags & Admin Invites
-- Adds multi-role support, vault×role feature matrix, and admin invite system.

BEGIN;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1a. ALTER users — multi-role support
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS roles              JSONB          NOT NULL DEFAULT '["investor"]',
  ADD COLUMN IF NOT EXISTS primary_role       VARCHAR(50)    NOT NULL DEFAULT 'investor',
  ADD COLUMN IF NOT EXISTS builder_approved   BOOLEAN        NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS builder_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS builder_approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS persona_selected_at TIMESTAMPTZ;

-- Migrate existing single-role data into the new roles array
UPDATE users
SET roles = jsonb_build_array(role),
    primary_role = role
WHERE roles = '["investor"]'
  AND role != 'investor';

-- Index for querying users by role membership
CREATE INDEX IF NOT EXISTS idx_users_roles ON users USING GIN (roles);
CREATE INDEX IF NOT EXISTS idx_users_primary_role ON users (primary_role);
CREATE INDEX IF NOT EXISTS idx_users_builder_approved ON users (builder_approved) WHERE builder_approved = true;

-- ═══════════════════════════════════════════════════════════════════════════
-- 1b. vault_feature_flags — per vault × per role feature toggles
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vault_feature_flags (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_type  VARCHAR(50) NOT NULL,   -- wealth | opportunity | community
  role        VARCHAR(50) NOT NULL,   -- investor | builder | admin | super_admin
  feature_key VARCHAR(100) NOT NULL,  -- e.g. view_opportunities, invest
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  updated_by  UUID        REFERENCES users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vault_type, role, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_vff_vault_role ON vault_feature_flags (vault_type, role);

-- ═══════════════════════════════════════════════════════════════════════════
-- 1c. admin_invites — invite-based admin/super_admin creation
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_invites (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) NOT NULL,
  role        VARCHAR(50)  NOT NULL,   -- admin | super_admin
  invited_by  UUID         NOT NULL REFERENCES users(id),
  token       VARCHAR(255) NOT NULL UNIQUE,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending',  -- pending | accepted | expired
  expires_at  TIMESTAMPTZ  NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON admin_invites (token);
CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON admin_invites (email);

-- ═══════════════════════════════════════════════════════════════════════════
-- 1d. Seed default vault-feature flags
-- 10 features × 3 vaults × 4 visible roles = 120 rows
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO vault_feature_flags (vault_type, role, feature_key, enabled) VALUES
-- ── Wealth Vault ────────────────────────────────────────────────────────
('wealth', 'investor',    'view_opportunities', true),
('wealth', 'investor',    'express_interest',   true),
('wealth', 'investor',    'invest',             true),
('wealth', 'investor',    'create_opportunities', false),
('wealth', 'investor',    'community_posts',    true),
('wealth', 'investor',    'profiling',          true),
('wealth', 'investor',    'referrals',          true),
('wealth', 'investor',    'analytics',          true),
('wealth', 'investor',    'kyc_verification',   true),
('wealth', 'investor',    'builder_questions',  false),

('wealth', 'builder',     'view_opportunities', true),
('wealth', 'builder',     'express_interest',   false),
('wealth', 'builder',     'invest',             false),
('wealth', 'builder',     'create_opportunities', true),
('wealth', 'builder',     'community_posts',    true),
('wealth', 'builder',     'profiling',          false),
('wealth', 'builder',     'referrals',          true),
('wealth', 'builder',     'analytics',          true),
('wealth', 'builder',     'kyc_verification',   true),
('wealth', 'builder',     'builder_questions',  true),

('wealth', 'admin',       'view_opportunities', true),
('wealth', 'admin',       'express_interest',   false),
('wealth', 'admin',       'invest',             false),
('wealth', 'admin',       'create_opportunities', true),
('wealth', 'admin',       'community_posts',    true),
('wealth', 'admin',       'profiling',          false),
('wealth', 'admin',       'referrals',          true),
('wealth', 'admin',       'analytics',          true),
('wealth', 'admin',       'kyc_verification',   true),
('wealth', 'admin',       'builder_questions',  true),

('wealth', 'super_admin', 'view_opportunities', true),
('wealth', 'super_admin', 'express_interest',   true),
('wealth', 'super_admin', 'invest',             true),
('wealth', 'super_admin', 'create_opportunities', true),
('wealth', 'super_admin', 'community_posts',    true),
('wealth', 'super_admin', 'profiling',          true),
('wealth', 'super_admin', 'referrals',          true),
('wealth', 'super_admin', 'analytics',          true),
('wealth', 'super_admin', 'kyc_verification',   true),
('wealth', 'super_admin', 'builder_questions',  true),

-- ── Opportunity Vault ───────────────────────────────────────────────────
('opportunity', 'investor',    'view_opportunities', true),
('opportunity', 'investor',    'express_interest',   true),
('opportunity', 'investor',    'invest',             true),
('opportunity', 'investor',    'create_opportunities', false),
('opportunity', 'investor',    'community_posts',    true),
('opportunity', 'investor',    'profiling',          true),
('opportunity', 'investor',    'referrals',          true),
('opportunity', 'investor',    'analytics',          true),
('opportunity', 'investor',    'kyc_verification',   true),
('opportunity', 'investor',    'builder_questions',  false),

('opportunity', 'builder',     'view_opportunities', true),
('opportunity', 'builder',     'express_interest',   false),
('opportunity', 'builder',     'invest',             false),
('opportunity', 'builder',     'create_opportunities', true),
('opportunity', 'builder',     'community_posts',    true),
('opportunity', 'builder',     'profiling',          false),
('opportunity', 'builder',     'referrals',          true),
('opportunity', 'builder',     'analytics',          true),
('opportunity', 'builder',     'kyc_verification',   true),
('opportunity', 'builder',     'builder_questions',  true),

('opportunity', 'admin',       'view_opportunities', true),
('opportunity', 'admin',       'express_interest',   false),
('opportunity', 'admin',       'invest',             false),
('opportunity', 'admin',       'create_opportunities', true),
('opportunity', 'admin',       'community_posts',    true),
('opportunity', 'admin',       'profiling',          false),
('opportunity', 'admin',       'referrals',          true),
('opportunity', 'admin',       'analytics',          true),
('opportunity', 'admin',       'kyc_verification',   true),
('opportunity', 'admin',       'builder_questions',  true),

('opportunity', 'super_admin', 'view_opportunities', true),
('opportunity', 'super_admin', 'express_interest',   true),
('opportunity', 'super_admin', 'invest',             true),
('opportunity', 'super_admin', 'create_opportunities', true),
('opportunity', 'super_admin', 'community_posts',    true),
('opportunity', 'super_admin', 'profiling',          true),
('opportunity', 'super_admin', 'referrals',          true),
('opportunity', 'super_admin', 'analytics',          true),
('opportunity', 'super_admin', 'kyc_verification',   true),
('opportunity', 'super_admin', 'builder_questions',  true),

-- ── Community Vault ─────────────────────────────────────────────────────
('community', 'investor',    'view_opportunities', true),
('community', 'investor',    'express_interest',   true),
('community', 'investor',    'invest',             false),
('community', 'investor',    'create_opportunities', false),
('community', 'investor',    'community_posts',    true),
('community', 'investor',    'profiling',          true),
('community', 'investor',    'referrals',          true),
('community', 'investor',    'analytics',          false),
('community', 'investor',    'kyc_verification',   true),
('community', 'investor',    'builder_questions',  false),

('community', 'builder',     'view_opportunities', true),
('community', 'builder',     'express_interest',   false),
('community', 'builder',     'invest',             false),
('community', 'builder',     'create_opportunities', true),
('community', 'builder',     'community_posts',    true),
('community', 'builder',     'profiling',          false),
('community', 'builder',     'referrals',          true),
('community', 'builder',     'analytics',          false),
('community', 'builder',     'kyc_verification',   true),
('community', 'builder',     'builder_questions',  true),

('community', 'admin',       'view_opportunities', true),
('community', 'admin',       'express_interest',   false),
('community', 'admin',       'invest',             false),
('community', 'admin',       'create_opportunities', true),
('community', 'admin',       'community_posts',    true),
('community', 'admin',       'profiling',          false),
('community', 'admin',       'referrals',          true),
('community', 'admin',       'analytics',          true),
('community', 'admin',       'kyc_verification',   true),
('community', 'admin',       'builder_questions',  true),

('community', 'super_admin', 'view_opportunities', true),
('community', 'super_admin', 'express_interest',   true),
('community', 'super_admin', 'invest',             true),
('community', 'super_admin', 'create_opportunities', true),
('community', 'super_admin', 'community_posts',    true),
('community', 'super_admin', 'profiling',          true),
('community', 'super_admin', 'referrals',          true),
('community', 'super_admin', 'analytics',          true),
('community', 'super_admin', 'kyc_verification',   true),
('community', 'super_admin', 'builder_questions',  true)

ON CONFLICT (vault_type, role, feature_key) DO NOTHING;

COMMIT;
