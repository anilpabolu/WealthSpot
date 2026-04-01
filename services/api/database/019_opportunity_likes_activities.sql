-- Migration 019: Create opportunity_likes, user_activities, property_referral_codes tables.

-- 1. Opportunity likes (heart / save)
CREATE TABLE IF NOT EXISTS opportunity_likes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_opp_like_user UNIQUE (opportunity_id, user_id)
);
CREATE INDEX IF NOT EXISTS ix_opp_likes_opportunity_id ON opportunity_likes(opportunity_id);
CREATE INDEX IF NOT EXISTS ix_opp_likes_user_id ON opportunity_likes(user_id);

-- 2. User activity feed
CREATE TABLE IF NOT EXISTS user_activities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type   VARCHAR(30) NOT NULL,
    resource_type   VARCHAR(30) NOT NULL,
    resource_id     UUID NOT NULL,
    resource_title  TEXT NOT NULL,
    resource_slug   VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS ix_user_activities_type ON user_activities(activity_type);

-- 3. Property-level referral codes (static per user + opportunity combo)
CREATE TABLE IF NOT EXISTS property_referral_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    code            VARCHAR(16) NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_prop_ref_user_opp UNIQUE (user_id, opportunity_id)
);
CREATE INDEX IF NOT EXISTS ix_prop_ref_code ON property_referral_codes(code);
CREATE INDEX IF NOT EXISTS ix_prop_ref_user ON property_referral_codes(user_id);

-- 4. Enhance referrals table: add referral_type and opportunity_id columns
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referral_type VARCHAR(20) DEFAULT 'platform';
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id);
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS property_referral_code_id UUID REFERENCES property_referral_codes(id);

-- 5. Track first-investment reward eligibility on referrals
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS first_investment_rewarded BOOLEAN DEFAULT FALSE;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS rewarded_investment_id UUID;
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS rewarded_at TIMESTAMPTZ;
