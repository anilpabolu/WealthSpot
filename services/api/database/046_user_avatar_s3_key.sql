-- Migration 046: Add avatar_s3_key column to users table
-- This enables clean S3 object deletion without URL parsing.

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_s3_key TEXT;

COMMENT ON COLUMN users.avatar_s3_key IS 'S3 object key for the user''s profile photo, e.g. avatars/{user_id}/{uuid}.jpg';
