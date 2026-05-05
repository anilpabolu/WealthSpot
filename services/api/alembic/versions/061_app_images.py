"""App-wide image management table

Revision ID: 061_app_images
Revises: 060_builder_update_reads
Create Date: 2026-05-04

"""
from collections.abc import Sequence
from typing import Union

from alembic import op

revision: str = "061_app_images"
down_revision: Union[str, None] = "060_builder_update_reads"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS app_images (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            page            VARCHAR(100)  NOT NULL,
            section_tag     VARCHAR(200)  NOT NULL,
            title           VARCHAR(300)  NOT NULL,
            description     TEXT,
            image_url       TEXT          NOT NULL,
            s3_key          TEXT,
            content_type    VARCHAR(100)  DEFAULT 'image/png',
            size_bytes      BIGINT,
            alt_text        TEXT,
            additional_info JSONB         DEFAULT '{}',
            is_active       BOOLEAN       DEFAULT TRUE,
            sort_order      INTEGER       DEFAULT 0,
            uploaded_by     UUID          REFERENCES users(id) ON DELETE SET NULL,
            created_at      TIMESTAMPTZ   DEFAULT now(),
            updated_at      TIMESTAMPTZ   DEFAULT now(),
            CONSTRAINT uq_app_image_page_section UNIQUE (page, section_tag)
        );
    """)

    op.execute("CREATE INDEX IF NOT EXISTS idx_app_images_page ON app_images (page);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_app_images_page_section ON app_images (page, section_tag);")
    op.execute("CREATE INDEX IF NOT EXISTS idx_app_images_active ON app_images (is_active) WHERE is_active = TRUE;")

    op.execute("""
        INSERT INTO app_images (page, section_tag, title, description, image_url, alt_text, is_active, sort_order) VALUES
          ('home', 'hero_image', 'Homepage Investment Journey Hero',
           'Primary pre-login homepage hero image. Replace this from Command & Control without changing code.',
           '/wealthspot-investment-journey.png',
           'WealthSpot investment journey from opportunity discovery to deal closure',
           TRUE, 1)
        ON CONFLICT (page, section_tag) DO NOTHING;
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS app_images;")
