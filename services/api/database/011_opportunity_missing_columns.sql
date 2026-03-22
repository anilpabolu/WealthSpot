-- Migration 011: Add missing columns to opportunities table
-- The Opportunity model has columns that were never added to the DB.

ALTER TABLE opportunities
    ADD COLUMN IF NOT EXISTS address_line1 TEXT,
    ADD COLUMN IF NOT EXISTS address_line2 TEXT,
    ADD COLUMN IF NOT EXISTS landmark TEXT,
    ADD COLUMN IF NOT EXISTS locality TEXT,
    ADD COLUMN IF NOT EXISTS pincode VARCHAR(10),
    ADD COLUMN IF NOT EXISTS district TEXT,
    ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India',
    ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
    ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7),
    ADD COLUMN IF NOT EXISTS video_url TEXT;
