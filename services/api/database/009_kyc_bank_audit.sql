-- 009_kyc_bank_audit.sql
-- KYC enhancements, Bank Details (encrypted), Audit trail improvements.

BEGIN;

-- ── 1. Add missing columns to kyc_documents ─────────────────────────────────
ALTER TABLE kyc_documents
    ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255),
    ADD COLUMN IF NOT EXISTS file_size_bytes   BIGINT,
    ADD COLUMN IF NOT EXISTS mime_type         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS rejection_reason  TEXT;

-- ── 2. Bank details table (all sensitive fields stored encrypted) ────────────
CREATE TABLE IF NOT EXISTS bank_details (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_holder_name_enc TEXT NOT NULL,
    account_number_enc      TEXT NOT NULL,
    ifsc_code_enc           TEXT NOT NULL,
    bank_name_enc           TEXT NOT NULL,
    branch_name_enc         TEXT,
    account_type            VARCHAR(20) NOT NULL DEFAULT 'savings',
    is_primary              BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bank_details_user_id ON bank_details(user_id);

-- ── 3. Add old_value / new_value to audit_logs ──────────────────────────────
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS old_value JSONB,
    ADD COLUMN IF NOT EXISTS new_value JSONB;

-- ── 4. Add ENCRYPTION_KEY placeholder to config (for reference) ─────────────
-- NOTE: Set ENCRYPTION_KEY in .env (Fernet key from cryptography.fernet.Fernet.generate_key())

COMMIT;
