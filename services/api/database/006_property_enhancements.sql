-- 006: Property enhancements — highlights, USP, video, referrer
-- Adds new columns to properties table for richer detail display

-- Enable trigram extension if not present (for fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Property highlights (bullet-point selling features)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';

-- Unique Selling Proposition
ALTER TABLE properties ADD COLUMN IF NOT EXISTS usp TEXT;

-- Video walkthrough URL
ALTER TABLE properties ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Referrer / person who shared this property listing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS referrer_name VARCHAR(255);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS referrer_phone VARCHAR(20);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS referrer_user_id UUID REFERENCES users(id);

-- Builder profile fields (for "know more about builder" page)
ALTER TABLE builders ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE builders ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE builders ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE builders ADD COLUMN IF NOT EXISTS experience_years INTEGER;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS projects_completed INTEGER DEFAULT 0;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS total_sqft_delivered INTEGER DEFAULT 0;
ALTER TABLE builders ADD COLUMN IF NOT EXISTS about TEXT;

-- Index for search autocomplete performance
CREATE INDEX IF NOT EXISTS idx_properties_title_trgm ON properties USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_locality_trgm ON properties USING gin (locality gin_trgm_ops);
