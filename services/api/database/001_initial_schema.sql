-- ============================================================================
-- WealthSpot – Initial Database Schema
-- Migration 001: All tables, indexes, constraints, triggers
-- Run against: PostgreSQL 16+
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE user_role AS ENUM ('investor', 'builder', 'lender', 'admin');
CREATE TYPE kyc_status AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE asset_type AS ENUM ('Residential', 'Commercial', 'Warehousing', 'Plotted Development', 'Mixed Use');
CREATE TYPE property_status AS ENUM ('draft', 'under_review', 'active', 'funding', 'funded', 'exited', 'rejected');
CREATE TYPE investment_status AS ENUM ('initiated', 'payment_pending', 'payment_received', 'confirmed', 'cancelled', 'refunded');
CREATE TYPE transaction_type AS ENUM ('investment', 'rental_payout', 'exit_payout', 'refund', 'fee');
CREATE TYPE post_type AS ENUM ('discussion', 'question', 'poll', 'announcement');
CREATE TYPE loan_status AS ENUM ('active', 'repaid', 'defaulted', 'pending');

-- ============================================================================
-- TABLE: users
-- ============================================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id        VARCHAR(255) UNIQUE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      TEXT,
    role            VARCHAR(20) NOT NULL DEFAULT 'investor',
    kyc_status      VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    pan_number      VARCHAR(10),
    aadhaar_hash    VARCHAR(64),
    referral_code   VARCHAR(12) UNIQUE,
    referred_by     UUID REFERENCES users(id),
    wealth_pass_active BOOLEAN DEFAULT FALSE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_referral_code ON users(referral_code);

COMMENT ON TABLE users IS 'All platform users: investors, builders, lenders, admins';

-- ============================================================================
-- TABLE: kyc_documents
-- ============================================================================

CREATE TABLE kyc_documents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type       VARCHAR(50) NOT NULL,   -- PAN / AADHAAR / SELFIE / ADDRESS_PROOF
    s3_key              TEXT NOT NULL,
    verification_status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING / VERIFIED / REJECTED
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kyc_documents_user_id ON kyc_documents(user_id);

COMMENT ON TABLE kyc_documents IS 'KYC identity documents uploaded by users';

-- ============================================================================
-- TABLE: builders
-- ============================================================================

CREATE TABLE builders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name    VARCHAR(255) NOT NULL,
    rera_number     VARCHAR(50),
    cin             VARCHAR(21),
    gstin           VARCHAR(15),
    website         TEXT,
    logo_url        TEXT,
    description     TEXT,
    verified        BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE builders IS 'Builder/developer company profiles linked to user accounts';

-- ============================================================================
-- TABLE: properties
-- ============================================================================

CREATE TABLE properties (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    builder_id      UUID NOT NULL REFERENCES builders(id) ON DELETE RESTRICT,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    title           VARCHAR(255) NOT NULL,
    tagline         VARCHAR(500),
    description     TEXT,
    asset_type      VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',

    -- Location
    city            VARCHAR(100) NOT NULL,
    state           VARCHAR(100) NOT NULL,
    locality        VARCHAR(255),
    address         TEXT,
    latitude        NUMERIC(10,7),
    longitude       NUMERIC(10,7),

    -- Financial
    target_amount   NUMERIC(15,2) NOT NULL,
    raised_amount   NUMERIC(15,2) DEFAULT 0,
    min_investment  NUMERIC(12,2) NOT NULL,
    unit_price      NUMERIC(12,2) NOT NULL,
    total_units     INTEGER NOT NULL,
    sold_units      INTEGER DEFAULT 0,
    target_irr      NUMERIC(5,2) NOT NULL,
    rental_yield    NUMERIC(5,2),

    -- Details
    area_sqft       INTEGER,
    bedrooms        INTEGER,
    possession_date VARCHAR(20),
    rera_id         VARCHAR(50),

    -- Media (PostgreSQL arrays & JSONB)
    cover_image     TEXT,
    gallery         TEXT[],
    documents       JSONB,
    amenities       VARCHAR(100)[],

    -- Stats
    investor_count  INTEGER DEFAULT 0,

    -- Timestamps
    launch_date     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_properties_builder_id ON properties(builder_id);
CREATE INDEX idx_properties_slug ON properties(slug);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_asset_type ON properties(asset_type);

COMMENT ON TABLE properties IS 'Real estate properties available for fractional investment';

-- ============================================================================
-- TABLE: investments
-- ============================================================================

CREATE TABLE investments (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    property_id         UUID NOT NULL REFERENCES properties(id) ON DELETE RESTRICT,
    units               INTEGER NOT NULL CHECK (units > 0),
    amount              NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    unit_price          NUMERIC(12,2) NOT NULL,
    status              VARCHAR(30) NOT NULL DEFAULT 'initiated',
    razorpay_order_id   VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    payment_metadata    JSONB,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_property_id ON investments(property_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_investments_razorpay_order_id ON investments(razorpay_order_id);

COMMENT ON TABLE investments IS 'User investment records with payment tracking';

-- ============================================================================
-- TABLE: transactions
-- ============================================================================

CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    investment_id   UUID NOT NULL REFERENCES investments(id) ON DELETE RESTRICT,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type            VARCHAR(30) NOT NULL,
    amount          NUMERIC(15,2) NOT NULL,
    description     TEXT,
    reference_id    VARCHAR(255),
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_investment_id ON transactions(investment_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);

COMMENT ON TABLE transactions IS 'Financial transaction ledger (investments, payouts, refunds, fees)';

-- ============================================================================
-- TABLE: community_posts
-- ============================================================================

CREATE TABLE community_posts (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_type   VARCHAR(20) DEFAULT 'discussion',
    title       VARCHAR(500) NOT NULL,
    body        TEXT NOT NULL,
    category    VARCHAR(50),
    tags        JSONB,
    upvotes     INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_pinned   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX idx_community_posts_category ON community_posts(category);

COMMENT ON TABLE community_posts IS 'Community forum posts (discussions, questions, polls)';

-- ============================================================================
-- TABLE: community_replies
-- ============================================================================

CREATE TABLE community_replies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id     UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body        TEXT NOT NULL,
    upvotes     INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_community_replies_post_id ON community_replies(post_id);

COMMENT ON TABLE community_replies IS 'Replies to community posts';

-- ============================================================================
-- TABLE: referrals
-- ============================================================================

CREATE TABLE referrals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id     UUID NOT NULL REFERENCES users(id),
    referee_id      UUID NOT NULL UNIQUE REFERENCES users(id),
    code_used       VARCHAR(12) NOT NULL,
    reward_amount   INTEGER DEFAULT 0,          -- in paise (INR cents)
    reward_claimed  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);

COMMENT ON TABLE referrals IS 'Referral tracking: who referred whom, reward status';

-- ============================================================================
-- TABLE: audit_logs (append-only)
-- ============================================================================

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id        UUID,
    action          VARCHAR(100) NOT NULL,
    resource_type   VARCHAR(50) NOT NULL,
    resource_id     VARCHAR(255),
    details         JSONB,
    ip_address      VARCHAR(45),
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

COMMENT ON TABLE audit_logs IS 'Immutable audit log for compliance (append-only by policy)';

-- ============================================================================
-- TABLE: loans
-- ============================================================================

CREATE TABLE loans (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lender_id           UUID NOT NULL REFERENCES users(id),
    property_id         UUID NOT NULL REFERENCES properties(id),
    principal           INTEGER NOT NULL,       -- in paise
    interest_rate       FLOAT NOT NULL,
    tenure_months       INTEGER NOT NULL,
    amount_repaid       INTEGER DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    next_payment_date   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loans_lender_id ON loans(lender_id);
CREATE INDEX idx_loans_property_id ON loans(property_id);
CREATE INDEX idx_loans_status ON loans(status);

COMMENT ON TABLE loans IS 'Lender loan records against properties';

-- ============================================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_properties
    BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_investments
    BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_community_posts
    BEFORE UPDATE ON community_posts
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
