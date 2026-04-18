-- Vault explorers: explicit tracking of vault exploration clicks
CREATE TABLE IF NOT EXISTS vault_explorers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vault_type VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, vault_type)
);

CREATE INDEX IF NOT EXISTS ix_vault_explorers_vault_type ON vault_explorers(vault_type);
