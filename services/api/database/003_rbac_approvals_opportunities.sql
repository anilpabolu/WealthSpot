-- ============================================================================
-- WealthSpot – Migration 003: RBAC, Approvals, Opportunities, Platform Config
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
