"""add knowledge hub tables

Creates ``knowledge_articles`` (admin-curated content tiles) and
``knowledge_assets`` (image / PDF attachments) for the Knowledge Hub feature.

Revision ID: 075_add_knowledge_hub
Revises: 074_remove_irr
Create Date: 2026-06-13

"""

from collections.abc import Sequence
from typing import Union

from alembic import op

revision: str = "075_add_knowledge_hub"
down_revision: Union[str, None] = "074_remove_irr"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS knowledge_articles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug VARCHAR(255) NOT NULL UNIQUE,
            title VARCHAR(255) NOT NULL,
            synopsis TEXT NOT NULL,
            body TEXT,
            cover_image_url TEXT,
            is_published BOOLEAN NOT NULL DEFAULT TRUE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_knowledge_articles_slug ON knowledge_articles (slug);"
    )

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS knowledge_assets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            article_id UUID NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
            asset_type VARCHAR(10) NOT NULL,
            s3_key TEXT NOT NULL,
            url TEXT NOT NULL,
            filename TEXT,
            content_type VARCHAR(100),
            size_bytes BIGINT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_knowledge_assets_article_id "
        "ON knowledge_assets (article_id);"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS knowledge_assets CASCADE;")
    op.execute("DROP TABLE IF EXISTS knowledge_articles CASCADE;")
