-- 037: Builder Updates + Attachments
-- One-liner timeline entries on opportunity pages, created by builders/admins.

CREATE TABLE IF NOT EXISTS builder_updates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    creator_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    title       VARCHAR(300) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_builder_updates_opportunity_id ON builder_updates(opportunity_id);

CREATE TABLE IF NOT EXISTS builder_update_attachments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_id   UUID NOT NULL REFERENCES builder_updates(id) ON DELETE CASCADE,
    filename    TEXT,
    s3_key      TEXT NOT NULL,
    url         TEXT NOT NULL,
    content_type VARCHAR(100),
    size_bytes  BIGINT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_builder_update_attachments_update_id ON builder_update_attachments(update_id);
