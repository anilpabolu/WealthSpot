"""Opportunity likes, user activities, property referral codes, referral enhancements

Revision ID: 019_likes_activities
Revises: 018_eoi_pipeline
Create Date: 2025-08-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "019_likes_activities"
down_revision: Union[str, None] = "018_eoi_pipeline"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Opportunity likes (idempotent)
    op.execute("""
        CREATE TABLE IF NOT EXISTS opportunity_likes (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
            user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at      TIMESTAMPTZ DEFAULT now(),
            CONSTRAINT uq_opp_like_user UNIQUE (opportunity_id, user_id)
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_opp_likes_opportunity_id ON opportunity_likes(opportunity_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_opp_likes_user_id ON opportunity_likes(user_id);")

    # 2. User activity feed (idempotent)
    op.execute("""
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
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_activities_user_id ON user_activities(user_id);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_activities_type ON user_activities(activity_type);")

    # 3. Property referral codes (idempotent)
    op.execute("""
        CREATE TABLE IF NOT EXISTS property_referral_codes (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
            code            VARCHAR(16) NOT NULL UNIQUE,
            created_at      TIMESTAMPTZ DEFAULT now(),
            CONSTRAINT uq_prop_ref_user_opp UNIQUE (user_id, opportunity_id)
        );
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_prop_ref_code ON property_referral_codes(code);")
    op.execute("CREATE INDEX IF NOT EXISTS ix_prop_ref_user ON property_referral_codes(user_id);")

    # 4. Enhance referrals table (idempotent)
    op.execute("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referral_type VARCHAR(20) DEFAULT 'platform';")
    op.execute("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS opportunity_id UUID REFERENCES opportunities(id);")
    op.execute("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS property_referral_code_id UUID REFERENCES property_referral_codes(id);")

    # 5. Track first-investment reward eligibility
    op.execute("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS first_investment_rewarded BOOLEAN DEFAULT FALSE;")
    op.execute("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS rewarded_investment_id UUID;")
    op.execute("ALTER TABLE referrals ADD COLUMN IF NOT EXISTS rewarded_at TIMESTAMPTZ;")


def downgrade() -> None:
    op.execute("ALTER TABLE referrals DROP COLUMN IF EXISTS rewarded_at;")
    op.execute("ALTER TABLE referrals DROP COLUMN IF EXISTS rewarded_investment_id;")
    op.execute("ALTER TABLE referrals DROP COLUMN IF EXISTS first_investment_rewarded;")
    op.execute("ALTER TABLE referrals DROP COLUMN IF EXISTS property_referral_code_id;")
    op.execute("ALTER TABLE referrals DROP COLUMN IF EXISTS opportunity_id;")
    op.execute("ALTER TABLE referrals DROP COLUMN IF EXISTS referral_type;")
    op.execute("DROP TABLE IF EXISTS property_referral_codes;")
    op.execute("DROP TABLE IF EXISTS user_activities;")
    op.execute("DROP TABLE IF EXISTS opportunity_likes;")
