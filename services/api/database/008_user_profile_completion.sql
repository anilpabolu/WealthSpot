-- 008_user_profile_completion.sql
-- Adds user profiling fields: risk profile, interests, skills, address, OTP verification, profile completion

BEGIN;

-- ── Risk Profile & Investment Appetite ──────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_income VARCHAR(50);          -- e.g. '5-10L', '10-25L', '25-50L', '50L-1Cr', '1Cr+'
ALTER TABLE users ADD COLUMN IF NOT EXISTS investment_experience VARCHAR(30);  -- 'beginner', 'intermediate', 'advanced'
ALTER TABLE users ADD COLUMN IF NOT EXISTS risk_tolerance VARCHAR(20);         -- 'conservative', 'moderate', 'aggressive'
ALTER TABLE users ADD COLUMN IF NOT EXISTS investment_horizon VARCHAR(30);     -- '1-3 years', '3-5 years', '5-10 years', '10+ years'
ALTER TABLE users ADD COLUMN IF NOT EXISTS monthly_investment_capacity VARCHAR(50); -- '5K-10K', '10K-25K', '25K-50K', '50K-1L', '1L+'

-- ── Interests ───────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS interests TEXT[];                   -- e.g. ['residential', 'commercial', 'co-working', 'warehousing']
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_cities TEXT[];            -- e.g. ['Hyderabad', 'Bengaluru', 'Mumbai']
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_topics TEXT[];         -- e.g. ['new_properties', 'community', 'market_insights', 'webinars']

-- ── Skills & Availability ───────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT[];                      -- e.g. ['marketing', 'legal', 'finance', 'tech', 'networking']
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_hours_available VARCHAR(20); -- '1-2', '3-5', '5-10', '10+'
ALTER TABLE users ADD COLUMN IF NOT EXISTS contribution_interests TEXT[];      -- e.g. ['mentoring', 'reviewing', 'referrals', 'content']

-- ── Address ─────────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(6);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(50) DEFAULT 'India';

-- ── OTP Verification ────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp_hash VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_hash VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_otp_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_otp_expires_at TIMESTAMPTZ;

-- ── Profile Completion ──────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion_pct INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_profile_completion ON users (profile_completion_pct);
CREATE INDEX IF NOT EXISTS idx_users_city ON users (city);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users (email_verified);
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users (phone_verified);

COMMIT;
