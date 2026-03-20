-- ============================================================================
-- WealthSpot – Migration 005: Companies, Pincodes, Points, Role Groups
-- Creates missing tables and adds new features
-- ============================================================================

-- ============================================================================
-- TABLE: companies
-- ============================================================================

CREATE TABLE IF NOT EXISTS companies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    company_name        VARCHAR(255) NOT NULL,
    brand_name          VARCHAR(255),
    entity_type         VARCHAR(50) NOT NULL DEFAULT 'private_limited',
    cin                 VARCHAR(21),
    gstin               VARCHAR(15),
    pan                 VARCHAR(10),
    rera_number         VARCHAR(50),
    website             TEXT,
    logo_url            TEXT,
    description         TEXT,
    contact_name        VARCHAR(255),
    contact_email       VARCHAR(255),
    contact_phone       VARCHAR(20),
    address_line1       TEXT,
    address_line2       TEXT,
    city                VARCHAR(100),
    state               VARCHAR(100),
    pincode             VARCHAR(10),
    country             VARCHAR(100) DEFAULT 'India',
    years_in_business   INTEGER,
    projects_completed  INTEGER DEFAULT 0,
    total_area_developed TEXT,
    verified            BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'pending',
    approval_id         UUID REFERENCES approval_requests(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);
CREATE INDEX IF NOT EXISTS idx_companies_verified ON companies(verified);

CREATE TRIGGER set_updated_at_companies
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE companies IS 'Builder/developer company profiles for opportunity creation';

-- ============================================================================
-- TABLE: indian_pincodes (reference table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS indian_pincodes (
    pincode         VARCHAR(10) PRIMARY KEY,
    office_name     VARCHAR(255),
    locality        VARCHAR(255),
    district        VARCHAR(100),
    state           VARCHAR(100),
    region          VARCHAR(100),
    division        VARCHAR(100),
    circle          VARCHAR(100),
    delivery        VARCHAR(10) DEFAULT 'Delivery'
);

COMMENT ON TABLE indian_pincodes IS 'India Post pincode reference for address auto-fill';

-- ============================================================================
-- TABLE: notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(50) NOT NULL,
    channel     VARCHAR(20) NOT NULL DEFAULT 'in_app',
    title       VARCHAR(255) NOT NULL,
    body        TEXT NOT NULL,
    data        JSONB,
    is_read     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

COMMENT ON TABLE notifications IS 'In-app, email, push notification tracking';

-- ============================================================================
-- TABLE: opportunity_media
-- ============================================================================

CREATE TABLE IF NOT EXISTS opportunity_media (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    media_type      VARCHAR(20) NOT NULL DEFAULT 'image',
    s3_key          TEXT NOT NULL,
    filename        VARCHAR(500),
    content_type    VARCHAR(100),
    size_bytes      BIGINT,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_media_opportunity_id ON opportunity_media(opportunity_id);

-- ============================================================================
-- TABLE: user_points – tracks contribution points per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_points (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action      VARCHAR(50) NOT NULL,
    points      INTEGER NOT NULL DEFAULT 0,
    reference_type VARCHAR(50),
    reference_id   VARCHAR(255),
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_points_user_id ON user_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_action ON user_points(action);

COMMENT ON TABLE user_points IS 'Gamification: tracks points earned by users for contributions';

-- ============================================================================
-- TABLE: role_groups – logical groups of users by role for messaging
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    roles       JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_updated_at_role_groups
    BEFORE UPDATE ON role_groups
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

COMMENT ON TABLE role_groups IS 'Logical role groups for bulk messaging and access control';

-- ============================================================================
-- TABLE: group_messages – messages sent to role groups
-- ============================================================================

CREATE TABLE IF NOT EXISTS group_messages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id        UUID NOT NULL REFERENCES role_groups(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject         VARCHAR(500) NOT NULL,
    body            TEXT NOT NULL,
    message_type    VARCHAR(20) NOT NULL DEFAULT 'announcement',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);

COMMENT ON TABLE group_messages IS 'Messages sent to role groups';

-- ============================================================================
-- ADD company_id to opportunities (if not exists)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'opportunities' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE opportunities ADD COLUMN company_id UUID REFERENCES companies(id);
        CREATE INDEX idx_opportunities_company ON opportunities(company_id);
    END IF;
END $$;

-- ============================================================================
-- SEED: Default role groups
-- ============================================================================

INSERT INTO role_groups (name, description, roles) VALUES
('Opportunity Creators', 'Users who can create and manage investment opportunities', '["builder", "founder", "community_lead"]'::jsonb),
('Approvers', 'Users who can review and approve platform actions', '["admin", "approver", "super_admin"]'::jsonb),
('Knowledge Contributors', 'Users who contribute answers and insights to community', '["knowledge_contributor", "admin", "super_admin"]'::jsonb),
('Investors', 'All active investors on the platform', '["investor"]'::jsonb),
('Platform Admins', 'Full platform administration access', '["admin", "super_admin"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SEED: Points config
-- ============================================================================

INSERT INTO platform_configs (section, key, value, description) VALUES
('points', 'question_asked', '{"value": 5}'::jsonb, 'Points for asking a question'),
('points', 'answer_approved', '{"value": 15}'::jsonb, 'Points for an approved answer'),
('points', 'post_created', '{"value": 3}'::jsonb, 'Points for creating a discussion/insight post'),
('points', 'reply_upvoted', '{"value": 2}'::jsonb, 'Points per upvote received on a reply'),
('points', 'company_onboarded', '{"value": 25}'::jsonb, 'Points for onboarding a company')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- CLEANUP: Remove seed/test users (keep only real signups)
-- Deactivate seed users so they don't show in Command Control
-- ============================================================================

UPDATE users SET is_active = FALSE 
WHERE email IN (
    'admin@wealthspot.in',
    'builder@wealthspot.in',
    'investor1@wealthspot.in',
    'investor2@wealthspot.in',
    'lender@wealthspot.in',
    'referred@wealthspot.in',
    'kmrpab@wealthspot.in'
);
