-- 010: Schema fixes — notification preferences, read_at column, file_size_bytes type
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add notification_preferences JSONB column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB;

-- 2. Add missing read_at column to notifications table (model had it, DB did not)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- 3. Fix kyc_documents.file_size_bytes type: was INTEGER in model, BIGINT in DB
--    DB already has BIGINT from 009, but ensure it's correct if schema was applied
--    from model (which had Integer). Safe ALTER to BIGINT using cast.
DO $$
BEGIN
  -- Only alter if the column type is integer (not already bigint)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kyc_documents'
      AND column_name = 'file_size_bytes'
      AND data_type = 'integer'
  ) THEN
    ALTER TABLE kyc_documents ALTER COLUMN file_size_bytes TYPE BIGINT;
  END IF;
END $$;
