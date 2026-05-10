INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
BEGIN;

INFO  [alembic.runtime.migration] Generating static SQL
INFO  [alembic.runtime.migration] Will assume transactional DDL.
CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL, 
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial, Initial schema û all 10 tables
-- Running upgrade  -> 001_initial

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    clerk_id VARCHAR(255), 
    email VARCHAR(255) NOT NULL, 
    full_name VARCHAR(255) NOT NULL, 
    phone VARCHAR(20), 
    avatar_url TEXT, 
    role VARCHAR(20) DEFAULT 'investor' NOT NULL, 
    kyc_status VARCHAR(20) DEFAULT 'NOT_STARTED' NOT NULL, 
    pan_number VARCHAR(10), 
    aadhaar_hash VARCHAR(64), 
    referral_code VARCHAR(12), 
    referred_by UUID, 
    wealth_pass_active BOOLEAN DEFAULT false, 
    is_active BOOLEAN DEFAULT true, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    UNIQUE (referral_code)
);

CREATE UNIQUE INDEX ix_users_clerk_id ON users (clerk_id);

CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE INDEX idx_users_role ON users (role);

CREATE INDEX idx_users_referral_code ON users (referral_code);

CREATE TABLE kyc_documents (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    user_id UUID NOT NULL, 
    document_type VARCHAR(50) NOT NULL, 
    s3_key TEXT NOT NULL, 
    verification_status VARCHAR(20) DEFAULT 'PENDING', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_kyc_documents_user_id ON kyc_documents (user_id);

COMMENT ON TABLE kyc_documents IS 'KYC identity documents uploaded by users';

CREATE TABLE builders (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    user_id UUID NOT NULL, 
    company_name VARCHAR(255) NOT NULL, 
    rera_number VARCHAR(50), 
    cin VARCHAR(21), 
    gstin VARCHAR(15), 
    website TEXT, 
    logo_url TEXT, 
    description TEXT, 
    verified BOOLEAN DEFAULT false, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    UNIQUE (user_id), 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE properties (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    builder_id UUID NOT NULL, 
    slug VARCHAR(255) NOT NULL, 
    title VARCHAR(255) NOT NULL, 
    tagline VARCHAR(500), 
    description TEXT, 
    asset_type VARCHAR(50) NOT NULL, 
    status VARCHAR(20) DEFAULT 'draft' NOT NULL, 
    city VARCHAR(100) NOT NULL, 
    state VARCHAR(100) NOT NULL, 
    locality VARCHAR(255), 
    address TEXT, 
    latitude NUMERIC(10, 7), 
    longitude NUMERIC(10, 7), 
    target_amount NUMERIC(15, 2) NOT NULL, 
    raised_amount NUMERIC(15, 2) DEFAULT '0', 
    min_investment NUMERIC(12, 2) NOT NULL, 
    unit_price NUMERIC(12, 2) NOT NULL, 
    total_units INTEGER NOT NULL, 
    sold_units INTEGER DEFAULT '0', 
    target_irr NUMERIC(5, 2) NOT NULL, 
    rental_yield NUMERIC(5, 2), 
    area_sqft INTEGER, 
    bedrooms INTEGER, 
    possession_date VARCHAR(20), 
    rera_id VARCHAR(50), 
    cover_image TEXT, 
    gallery TEXT[], 
    documents JSONB, 
    amenities VARCHAR(100)[], 
    investor_count INTEGER DEFAULT '0', 
    launch_date TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(builder_id) REFERENCES builders (id) ON DELETE RESTRICT
);

CREATE INDEX ix_properties_city ON properties (city);

CREATE INDEX ix_properties_builder_id ON properties (builder_id);

CREATE UNIQUE INDEX ix_properties_slug ON properties (slug);

CREATE INDEX ix_properties_status ON properties (status);

CREATE TABLE investments (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    user_id UUID NOT NULL, 
    property_id UUID NOT NULL, 
    units INTEGER NOT NULL, 
    amount NUMERIC(15, 2) NOT NULL, 
    unit_price NUMERIC(12, 2) NOT NULL, 
    status VARCHAR(30) DEFAULT 'initiated' NOT NULL, 
    razorpay_order_id VARCHAR(100), 
    razorpay_payment_id VARCHAR(100), 
    payment_metadata JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE RESTRICT, 
    FOREIGN KEY(property_id) REFERENCES properties (id) ON DELETE RESTRICT
);

CREATE INDEX ix_investments_property_id ON investments (property_id);

CREATE INDEX ix_investments_status ON investments (status);

CREATE INDEX ix_investments_user_id ON investments (user_id);

CREATE INDEX idx_investments_razorpay_order_id ON investments (razorpay_order_id);

CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    investment_id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    type VARCHAR(30) NOT NULL, 
    amount NUMERIC(15, 2) NOT NULL, 
    description TEXT, 
    reference_id VARCHAR(255), 
    metadata JSONB, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(investment_id) REFERENCES investments (id) ON DELETE RESTRICT, 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX ix_transactions_investment_id ON transactions (investment_id);

CREATE INDEX ix_transactions_user_id ON transactions (user_id);

CREATE INDEX idx_transactions_type ON transactions (type);

CREATE TABLE community_posts (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    user_id UUID NOT NULL, 
    post_type VARCHAR(20) DEFAULT 'discussion', 
    title VARCHAR(500) NOT NULL, 
    body TEXT NOT NULL, 
    category VARCHAR(50), 
    tags JSONB, 
    upvotes INTEGER DEFAULT '0', 
    reply_count INTEGER DEFAULT '0', 
    is_pinned BOOLEAN DEFAULT false, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_community_posts_user_id ON community_posts (user_id);

CREATE INDEX idx_community_posts_category ON community_posts (category);

CREATE TABLE community_replies (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    post_id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    body TEXT NOT NULL, 
    upvotes INTEGER DEFAULT '0', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(post_id) REFERENCES community_posts (id) ON DELETE CASCADE, 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX ix_community_replies_post_id ON community_replies (post_id);

CREATE TABLE referrals (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    referrer_id UUID NOT NULL, 
    referee_id UUID NOT NULL, 
    code_used VARCHAR(12) NOT NULL, 
    reward_amount INTEGER DEFAULT '0', 
    reward_claimed BOOLEAN DEFAULT false, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(referrer_id) REFERENCES users (id), 
    UNIQUE (referee_id), 
    FOREIGN KEY(referee_id) REFERENCES users (id)
);

CREATE INDEX ix_referrals_referrer_id ON referrals (referrer_id);

CREATE TABLE audit_logs (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    actor_id UUID, 
    action VARCHAR(100) NOT NULL, 
    resource_type VARCHAR(50) NOT NULL, 
    resource_id VARCHAR(255), 
    details JSONB, 
    ip_address VARCHAR(45), 
    user_agent TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id)
);

CREATE INDEX ix_audit_logs_created_at ON audit_logs (created_at);

CREATE INDEX ix_audit_logs_action ON audit_logs (action);

CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);

CREATE TABLE loans (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    lender_id UUID NOT NULL, 
    property_id UUID NOT NULL, 
    principal INTEGER NOT NULL, 
    interest_rate FLOAT NOT NULL, 
    tenure_months INTEGER NOT NULL, 
    amount_repaid INTEGER DEFAULT '0', 
    status VARCHAR(20) DEFAULT 'pending' NOT NULL, 
    next_payment_date TIMESTAMP WITH TIME ZONE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    PRIMARY KEY (id), 
    FOREIGN KEY(lender_id) REFERENCES users (id), 
    FOREIGN KEY(property_id) REFERENCES properties (id)
);

CREATE INDEX ix_loans_lender_id ON loans (lender_id);

CREATE INDEX ix_loans_property_id ON loans (property_id);

CREATE INDEX idx_loans_status ON loans (status);

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;;

CREATE TRIGGER set_updated_at_users
            BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();;

CREATE TRIGGER set_updated_at_properties
            BEFORE UPDATE ON properties
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();;

CREATE TRIGGER set_updated_at_investments
            BEFORE UPDATE ON investments
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();;

CREATE TRIGGER set_updated_at_community_posts
            BEFORE UPDATE ON community_posts
            FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();;

INSERT INTO alembic_version (version_num) VALUES ('001_initial') RETURNING alembic_version.version_num;

INFO  [alembic.runtime.migration] Running upgrade 001_initial -> 003_rbac, RBAC, Approvals, Opportunities, Platform Config
-- Running upgrade 001_initial -> 003_rbac

-- ============================================================================
-- WealthSpot û Migration 003: RBAC, Approvals, Opportunities, Platform Config
-- ============================================================================

-- Update user_role enum to include new roles
-- (Since we use VARCHAR not native enum, just update check constraint if any)

-- ============================================================================
-- TABLE: approval_requests
-- ============================================================================

CREATE TABLE IF NOT EXISTS approval_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id     UUID REFERENCES users(id),
    category        VARCHAR(40) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority        VARCHAR(10) NOT NULL DEFAULT 'normal',
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    resource_type   VARCHAR(50),
    resource_id     VARCHAR(255),
    payload         JSONB,
    review_note     TEXT,
    auto_approve    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_requester ON approval_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_approval_requests_reviewer ON approval_requests(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_approval_requests_category ON approval_requests(category);

CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON approval_requests(status);

CREATE INDEX IF NOT EXISTS idx_approval_requests_created_at ON approval_requests(created_at);

COMMENT ON TABLE approval_requests IS 'Generic approval workflow for all platform actions';

-- ============================================================================
-- TABLE: opportunities
-- ============================================================================

CREATE TABLE IF NOT EXISTS opportunities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vault_type          VARCHAR(20) NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'draft',
    approval_id         UUID REFERENCES approval_requests(id),
    title               VARCHAR(255) NOT NULL,
    slug                VARCHAR(255) NOT NULL UNIQUE,
    tagline             VARCHAR(500),
    description         TEXT,
    -- Location
    city                VARCHAR(100),
    state               VARCHAR(100),
    address             TEXT,
    -- Financials
    target_amount       NUMERIC(15,2),
    raised_amount       NUMERIC(15,2) DEFAULT 0,
    min_investment      NUMERIC(12,2),
    target_irr          NUMERIC(5,2),
    -- Startup-specific
    industry            VARCHAR(100),
    stage               VARCHAR(50),
    founder_name        VARCHAR(255),
    pitch_deck_url      TEXT,
    -- Community-specific
    community_type      VARCHAR(100),
    collaboration_type  VARCHAR(100),
    -- Media
    cover_image         TEXT,
    gallery             TEXT[],
    documents           JSONB,
    template_s3_key     TEXT,
    template_data       JSONB,
    -- Stats
    investor_count      INTEGER DEFAULT 0,
    -- Timestamps
    launch_date         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_creator ON opportunities(creator_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_vault_type ON opportunities(vault_type);

CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);

CREATE INDEX IF NOT EXISTS idx_opportunities_slug ON opportunities(slug);

CREATE INDEX IF NOT EXISTS idx_opportunities_city ON opportunities(city);

COMMENT ON TABLE opportunities IS 'Multi-vault investment opportunities (Wealth / Opportunity / Community)';

-- ============================================================================
-- TABLE: platform_configs
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_configs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section         VARCHAR(100) NOT NULL,
    key             VARCHAR(255) NOT NULL,
    value           JSONB,
    description     TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    updated_by      UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_configs_section ON platform_configs(section);

CREATE INDEX IF NOT EXISTS idx_platform_configs_key ON platform_configs(key);

CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_configs_section_key ON platform_configs(section, key);

COMMENT ON TABLE platform_configs IS 'Command Control Centre configuration store';

-- ============================================================================
-- TRIGGERS: auto-update updated_at for new tables
-- ============================================================================

CREATE TRIGGER set_updated_at_approval_requests
    BEFORE UPDATE ON approval_requests
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_opportunities
    BEFORE UPDATE ON opportunities
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_platform_configs
    BEFORE UPDATE ON platform_configs
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- SEED: Super Admin user (kmrpab)
-- ============================================================================

INSERT INTO users (id, clerk_id, email, full_name, phone, role, kyc_status, referral_code, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000099',
    'clerk_kmrpab',
    'kmrpab@wealthspot.in',
    'KMR PAB',
    '+919999999999',
    'super_admin',
    'APPROVED',
    'SUPER001',
    TRUE
) ON CONFLICT (email) DO UPDATE SET role = 'super_admin';

-- ============================================================================
-- SEED: Default platform configs
-- ============================================================================

INSERT INTO platform_configs (section, key, value, description) VALUES
('approvals', 'auto_approve_pillar_access', '{"enabled": false}'::jsonb, 'Auto-approve pillar access requests'),
('approvals', 'auto_approve_role_assignment', '{"enabled": false}'::jsonb, 'Auto-approve role assignment requests'),
('approvals', 'auto_approve_community_projects', '{"enabled": false}'::jsonb, 'Auto-approve community project listings'),
('notifications', 'email_enabled', '{"enabled": true}'::jsonb, 'Enable email notifications'),
('notifications', 'whatsapp_enabled', '{"enabled": false}'::jsonb, 'Enable WhatsApp notifications'),
('content', 'onboarding_video_url', '{"url": "https://www.w3schools.com/html/mov_bbb.mp4"}'::jsonb, 'Onboarding video URL'),
('content', 'wealth_vault_video_url', '{"url": "https://www.w3schools.com/html/mov_bbb.mp4"}'::jsonb, 'Wealth Vault intro video'),
('content', 'opportunity_vault_video_url', '{"url": "https://www.w3schools.com/html/movie.mp4"}'::jsonb, 'Opportunity Vault intro video'),
('content', 'community_vault_video_url', '{"url": "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"}'::jsonb, 'Community Vault intro video'),
('platform', 'maintenance_mode', '{"enabled": false}'::jsonb, 'Enable platform maintenance mode'),
('platform', 'max_upload_size_mb', '{"value": 25}'::jsonb, 'Maximum file upload size in MB'),
('templates', 'wealth_template_url', '{"url": "/templates/wealth_opportunity_template.xlsx"}'::jsonb, 'Wealth vault opportunity creation template'),
('templates', 'opportunity_template_url', '{"url": "/templates/startup_opportunity_template.xlsx"}'::jsonb, 'Startup opportunity creation template'),
('templates', 'community_template_url', '{"url": "/templates/community_opportunity_template.xlsx"}'::jsonb, 'Community opportunity creation template');

UPDATE alembic_version SET version_num='003_rbac' WHERE alembic_version.version_num = '001_initial';

INFO  [alembic.runtime.migration] Running upgrade 003_rbac -> 004_community, Community enhancements û likes tables, reply approval flow, platform configs
-- Running upgrade 003_rbac -> 004_community

CREATE TABLE community_post_likes (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    post_id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
    PRIMARY KEY (id), 
    CONSTRAINT uq_post_like UNIQUE (post_id, user_id), 
    FOREIGN KEY(post_id) REFERENCES community_posts (id) ON DELETE CASCADE, 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_community_post_likes_post ON community_post_likes (post_id);

CREATE INDEX idx_community_post_likes_user ON community_post_likes (user_id);

CREATE TABLE community_reply_likes (
    id UUID DEFAULT uuid_generate_v4() NOT NULL, 
    reply_id UUID NOT NULL, 
    user_id UUID NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), 
    PRIMARY KEY (id), 
    CONSTRAINT uq_reply_like UNIQUE (reply_id, user_id), 
    FOREIGN KEY(reply_id) REFERENCES community_replies (id) ON DELETE CASCADE, 
    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_community_reply_likes_reply ON community_reply_likes (reply_id);

CREATE INDEX idx_community_reply_likes_user ON community_reply_likes (user_id);

ALTER TABLE community_replies ADD COLUMN is_approved BOOLEAN DEFAULT 'true' NOT NULL;

ALTER TABLE community_replies ADD COLUMN approval_request_id UUID;

ALTER TABLE community_replies ADD FOREIGN KEY(approval_request_id) REFERENCES approval_requests (id) ON DELETE SET NULL;

INSERT INTO platform_configs (section, key, value, description)
        SELECT 'community', 'post_max_words', '300'::jsonb, 'Maximum word count for a community post body'
        WHERE NOT EXISTS (SELECT 1 FROM platform_configs WHERE section = 'community' AND key = 'post_max_words');

INSERT INTO platform_configs (section, key, value, description)
        SELECT 'community', 'post_min_words', '10'::jsonb, 'Minimum word count for a community post body'
        WHERE NOT EXISTS (SELECT 1 FROM platform_configs WHERE section = 'community' AND key = 'post_min_words');

UPDATE alembic_version SET version_num='004_community' WHERE alembic_version.version_num = '003_rbac';

-- Running upgrade 004_community -> 005_companies

INFO  [alembic.runtime.migration] Running upgrade 004_community -> 005_companies, Companies, Pincodes, Points, Groups, Notifications, Opportunity Media
-- ============================================================================
-- WealthSpot û Migration 005: Companies, Pincodes, Points, Role Groups
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
-- TABLE: user_points û tracks contribution points per user
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
-- TABLE: role_groups û logical groups of users by role for messaging
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
-- TABLE: group_messages û messages sent to role groups
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

UPDATE alembic_version SET version_num='005_companies' WHERE alembic_version.version_num = '004_community';

INFO  [alembic.runtime.migration] Running upgrade 005_companies -> 005b_media, Media, Address, Company additions (005b overlay)
-- Running upgrade 005_companies -> 005b_media

Traceback (most recent call last):
  File "<frozen runpy>", line 198, in _run_module_as_main
  File "<frozen runpy>", line 88, in _run_code
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\__main__.py", line 4, in <module>
    main(prog="alembic")
    ~~~~^^^^^^^^^^^^^^^^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\config.py", line 1047, in main
    CommandLine(prog=prog).main(argv=argv)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\config.py", line 1037, in main
    self.run_cmd(cfg, options)
    ~~~~~~~~~~~~^^^^^^^^^^^^^^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\config.py", line 971, in run_cmd
    fn(
    ~~^
        config,
        ^^^^^^^
        *[getattr(options, k, None) for k in positional],
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        **{k: getattr(options, k, None) for k in kwarg},
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\command.py", line 483, in upgrade
    script.run_env()
    ~~~~~~~~~~~~~~^^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\script\base.py", line 545, in run_env
    util.load_python_file(self.dir, "env.py")
    ~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\util\pyfiles.py", line 116, in load_python_file
    module = load_module_py(module_id, path)
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\util\pyfiles.py", line 136, in load_module_py
    spec.loader.exec_module(module)  # type: ignore
    ~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^
  File "<frozen importlib._bootstrap_external>", line 1023, in exec_module
  File "<frozen importlib._bootstrap>", line 488, in _call_with_frames_removed
  File "C:\Users\repos\WealthSpot\services\api\alembic\env.py", line 119, in <module>
    run_migrations_offline()
    ~~~~~~~~~~~~~~~~~~~~~~^^
  File "C:\Users\repos\WealthSpot\services\api\alembic\env.py", line 85, in run_migrations_offline
    context.run_migrations()
    ~~~~~~~~~~~~~~~~~~~~~~^^
  File "<string>", line 8, in run_migrations
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\runtime\environment.py", line 969, in run_migrations
    self.get_context().run_migrations(**kw)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\runtime\migration.py", line 626, in run_migrations
    step.migration_fn(**kw)
    ~~~~~~~~~~~~~~~~~^^^^^^
  File "C:\Users\repos\WealthSpot\services\api\alembic\versions\005b_media_address_company.py", line 23, in upgrade
    exec_sql_file(_SQL_FILE)
    ~~~~~~~~~~~~~^^^^^^^^^^^
  File "C:\Users\repos\WealthSpot\services\api\sql_utils.py", line 24, in exec_sql_file
    op.execute(text(stmt))
    ~~~~~~~~~~^^^^^^^^^^^^
  File "<string>", line 8, in execute
  File "<string>", line 3, in execute
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\operations\ops.py", line 2667, in execute
    return operations.invoke(op)
           ~~~~~~~~~~~~~~~~~^^^^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\operations\base.py", line 452, in invoke
    return fn(self, operation)
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\operations\toimpl.py", line 259, in execute_sql
    operations.migration_context.impl.execute(
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        operation.sqltext, execution_options=operation.execution_options
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\ddl\impl.py", line 263, in execute
    self._exec(sql, execution_options)
    ~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\ddl\impl.py", line 237, in _exec
    self.static_output(
    ~~~~~~~~~~~~~~~~~~^
        str(compiled).replace("\t", "    ").strip()
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        + self.command_terminator
        ^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\site-packages\alembic\ddl\impl.py", line 148, in static_output
    self.output_buffer.write(text + "\n\n")
    ~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^
  File "C:\Users\anilk\AppData\Local\Programs\Python\Python313\Lib\encodings\cp1252.py", line 19, in encode
    return codecs.charmap_encode(input,self.errors,encoding_table)[0]
           ~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
UnicodeEncodeError: 'charmap' codec can't encode characters in position 245-246: character maps to <undefined>
