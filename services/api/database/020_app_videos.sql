-- 020: App-wide video management table
-- Allows admins to tag, upload, and manage videos by page + section
-- so that videos across the entire application can be managed from Command Control.

CREATE TABLE IF NOT EXISTS app_videos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page            VARCHAR(100)  NOT NULL,                     -- e.g. 'vaults', 'opportunity_detail', 'home'
    section_tag     VARCHAR(200)  NOT NULL,                     -- e.g. 'wealth_vault_intro', 'opportunity_vault_intro'
    title           VARCHAR(300)  NOT NULL,                     -- human-readable title
    description     TEXT,                                        -- optional description
    video_url       TEXT          NOT NULL,                      -- public URL of the video
    s3_key          TEXT,                                        -- S3/MinIO key (if uploaded)
    content_type    VARCHAR(100)  DEFAULT 'video/mp4',
    size_bytes      BIGINT,
    thumbnail_url   TEXT,                                        -- optional poster/thumbnail
    additional_info JSONB         DEFAULT '{}',                  -- arbitrary metadata
    is_active       BOOLEAN       DEFAULT TRUE,
    sort_order      INTEGER       DEFAULT 0,
    uploaded_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ   DEFAULT now(),
    updated_at      TIMESTAMPTZ   DEFAULT now(),

    -- Each page+section can only have one active video
    CONSTRAINT uq_app_video_page_section UNIQUE (page, section_tag)
);

CREATE INDEX IF NOT EXISTS idx_app_videos_page ON app_videos (page);
CREATE INDEX IF NOT EXISTS idx_app_videos_page_section ON app_videos (page, section_tag);
CREATE INDEX IF NOT EXISTS idx_app_videos_active ON app_videos (is_active) WHERE is_active = TRUE;

-- Seed known video slots with sample videos
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
