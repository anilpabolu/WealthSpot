"""App-wide video management table

Revision ID: 020_app_videos
Revises: 019_likes_activities
Create Date: 2025-08-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision: str = "020_app_videos"
down_revision: Union[str, None] = "019_likes_activities"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS app_videos (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            page            VARCHAR(100)  NOT NULL,
            section_tag     VARCHAR(200)  NOT NULL,
            title           VARCHAR(300)  NOT NULL,
            description     TEXT,
            video_url       TEXT          NOT NULL,
            s3_key          TEXT,
            content_type    VARCHAR(100)  DEFAULT 'video/mp4',
            size_bytes      BIGINT,
            thumbnail_url   TEXT,
            additional_info JSONB         DEFAULT '{}',
            is_active       BOOLEAN       DEFAULT TRUE,
            sort_order      INTEGER       DEFAULT 0,
            uploaded_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
            created_at      TIMESTAMPTZ   DEFAULT now(),
            updated_at      TIMESTAMPTZ   DEFAULT now(),
            CONSTRAINT uq_app_video_page_section UNIQUE (page, section_tag)
        );
    """)

    op.execute("CREATE INDEX IF NOT EXISTS idx_app_videos_page ON app_videos (page);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_app_videos_page_section ON app_videos (page, section_tag);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_app_videos_active ON app_videos (is_active) WHERE is_active = TRUE;")

    # Seed video slots (idempotent via ON CONFLICT)
    op.execute("""
        INSERT INTO app_videos (page, section_tag, title, description, video_url, is_active, sort_order) VALUES
          ('vaults', 'wealth_vault_intro',       'Wealth Vault Introduction',       'Introduction to the Wealth Vault — RERA-verified real estate investments.',
           'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 1),
          ('vaults', 'opportunity_vault_intro',   'Opportunity Vault Introduction',   'Introduction to the Opportunity Vault — high-potential startup investments.',
           'https://www.w3schools.com/html/movie.mp4', TRUE, 2),
          ('vaults', 'community_vault_intro',     'Community Vault Introduction',     'Introduction to the Community Vault — community-driven opportunities.',
           'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', TRUE, 3),
          ('vaults', 'wealth_investors_pillar',   'Wealth Investors Pillar',          'Deploy capital across vaults and earn passive returns.',
           'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 4),
          ('vaults', 'time_investors_pillar',     'Time Investors Pillar',            'Contribute your time and effort to community projects.',
           'https://www.w3schools.com/html/movie.mp4', TRUE, 5),
          ('vaults', 'network_investors_pillar',  'Network Investors Pillar',         'Open doors with your relationships and connections.',
           'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', TRUE, 6),
          ('vaults', 'education_investors_pillar','Education Investors Pillar',       'Share domain expertise and strategic advisory.',
           'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4', TRUE, 7),
          ('opportunity_detail', 'property_tour', 'Property Tour Video',              'Virtual tour video for property listings.',
           'http://localhost:9000/wealthspot-media/videos/sample-property-tour.mp4', TRUE, 1),
          ('home', 'hero_video',                 'Homepage Hero Video',              'Main hero banner video on the homepage.',
           'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 1),
          ('home', 'how_it_works',              'How It Works',                     'Explainer video on how WealthSpot works.',
           'https://www.w3schools.com/html/movie.mp4', TRUE, 2)
        ON CONFLICT (page, section_tag) DO NOTHING;
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS app_videos;")
