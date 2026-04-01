-- 022: EOI stage history – audit trail for pipeline stage transitions
-- Tracks when each EOI moved to each stage and who triggered it.

CREATE TABLE IF NOT EXISTS eoi_stage_history (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    eoi_id      UUID         NOT NULL REFERENCES expressions_of_interest(id) ON DELETE CASCADE,
    status      VARCHAR(30)  NOT NULL,
    changed_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
    changed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eoi_stage_history_eoi ON eoi_stage_history(eoi_id);
CREATE INDEX IF NOT EXISTS idx_eoi_stage_history_eoi_status ON eoi_stage_history(eoi_id, status);

-- Seed history for existing EOIs so every record has at least one entry
INSERT INTO eoi_stage_history (eoi_id, status, changed_at)
SELECT id, status, COALESCE(created_at, NOW())
FROM expressions_of_interest e
WHERE NOT EXISTS (
    SELECT 1 FROM eoi_stage_history h WHERE h.eoi_id = e.id
);
