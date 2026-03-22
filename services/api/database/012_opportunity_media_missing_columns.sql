-- Migration 012: Add missing columns to opportunity_media table

ALTER TABLE opportunity_media
    ADD COLUMN IF NOT EXISTS url TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS is_cover BOOLEAN NOT NULL DEFAULT FALSE;
