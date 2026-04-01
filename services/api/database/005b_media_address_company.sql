-- ============================================================================
-- Migration 005: Media uploads, address details, company/builder onboarding
-- ============================================================================

-- ── 1. Opportunity media (images + videos) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS opportunity_media (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    media_type  VARCHAR(10) NOT NULL CHECK (media_type IN ('image', 'video')),
    s3_key      TEXT NOT NULL,
    url         TEXT NOT NULL,
    filename    TEXT,
    size_bytes  BIGINT,
    content_type VARCHAR(100),
    sort_order  INT DEFAULT 0,
    is_cover    BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opp_media_opp_id ON opportunity_media(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_media_type ON opportunity_media(media_type);

-- ── 2. Enhanced address for opportunities ───────────────────────────────────

ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS address_line1 TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS address_line2 TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS landmark TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India';
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 7);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 7);
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ── 3. Company / Builder onboarding ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS companies (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    company_name    VARCHAR(255) NOT NULL,
    brand_name      VARCHAR(255),
    entity_type     VARCHAR(50) NOT NULL DEFAULT 'private_limited'
                    CHECK (entity_type IN (
                        'private_limited', 'public_limited', 'llp', 'partnership',
                        'proprietorship', 'trust', 'society', 'individual'
                    )),
    cin             VARCHAR(21),
    gstin           VARCHAR(15),
    pan             VARCHAR(10),
    rera_number     VARCHAR(50),
    website         TEXT,
    logo_url        TEXT,
    description     TEXT,
    -- Contact
    contact_name    VARCHAR(255),
    contact_email   VARCHAR(255),
    contact_phone   VARCHAR(20),
    -- Address
    address_line1   TEXT,
    address_line2   TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    pincode         VARCHAR(10),
    country         VARCHAR(100) DEFAULT 'India',
    -- Track record
    years_in_business   INT,
    projects_completed  INT DEFAULT 0,
    total_area_developed TEXT,
    -- Verification
    verified        BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) DEFAULT 'pending'
                    CHECK (verification_status IN ('pending', 'in_review', 'verified', 'rejected')),
    approval_id     UUID REFERENCES approval_requests(id),
    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_cin ON companies(cin) WHERE cin IS NOT NULL;

-- Link opportunities to companies
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
CREATE INDEX IF NOT EXISTS idx_opp_company ON opportunities(company_id);

-- ── 4. Indian pincode reference (pre-populated via seed or API) ─────────────

CREATE TABLE IF NOT EXISTS indian_pincodes (
    pincode     VARCHAR(10) PRIMARY KEY,
    office_name VARCHAR(255),
    locality    VARCHAR(255),
    district    VARCHAR(100),
    state       VARCHAR(100),
    region      VARCHAR(100),
    division    VARCHAR(100),
    circle      VARCHAR(100),
    delivery    VARCHAR(10) DEFAULT 'Delivery'
);

-- Seed a handful of popular pincodes for offline dev
INSERT INTO indian_pincodes (pincode, office_name, locality, district, state) VALUES
    ('400001', 'G.P.O.', 'Fort', 'Mumbai', 'Maharashtra'),
    ('400051', 'Bandra West S.O.', 'Bandra West', 'Mumbai Suburban', 'Maharashtra'),
    ('110001', 'New Delhi G.P.O.', 'Connaught Place', 'New Delhi', 'Delhi'),
    ('560001', 'Bangalore G.P.O.', 'M.G. Road', 'Bangalore', 'Karnataka'),
    ('500001', 'Hyderabad G.P.O.', 'Abids', 'Hyderabad', 'Telangana'),
    ('411001', 'Pune G.P.O.', 'Pune Camp', 'Pune', 'Maharashtra'),
    ('600001', 'Chennai G.P.O.', 'George Town', 'Chennai', 'Tamil Nadu'),
    ('380001', 'Ahmedabad G.P.O.', 'Lal Darwaja', 'Ahmedabad', 'Gujarat'),
    ('302001', 'Jaipur G.P.O.', 'M.I. Road', 'Jaipur', 'Rajasthan'),
    ('700001', 'Kolkata G.P.O.', 'B.B.D. Bagh', 'Kolkata', 'West Bengal'),
    ('226001', 'Lucknow G.P.O.', 'Hazratganj', 'Lucknow', 'Uttar Pradesh'),
    ('403001', 'Panaji', 'Panaji', 'North Goa', 'Goa'),
    ('530001', 'Visakhapatnam H.O.', 'Visakhapatnam', 'Visakhapatnam', 'Andhra Pradesh'),
    ('682001', 'Kochi H.O.', 'Fort Kochi', 'Ernakulam', 'Kerala'),
    ('452001', 'Indore G.P.O.', 'Rajwada', 'Indore', 'Madhya Pradesh')
ON CONFLICT (pincode) DO NOTHING;

-- ── 5. Seed platform configs for upload limits ──────────────────────────────

-- Ensure unique constraint exists for ON CONFLICT to work
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_configs_section_key ON platform_configs(section, key);

INSERT INTO platform_configs (section, key, value) VALUES
    ('uploads', 'max_images_per_opportunity', '{"value": 20}'),
    ('uploads', 'max_video_size_mb', '{"value": 500}'),
    ('uploads', 'max_image_size_mb', '{"value": 10}'),
    ('uploads', 'allowed_image_types', '{"value": ["image/jpeg", "image/png", "image/webp"]}'),
    ('uploads', 'allowed_video_types', '{"value": ["video/mp4", "video/webm", "video/quicktime"]}')
ON CONFLICT (section, key) DO NOTHING;
