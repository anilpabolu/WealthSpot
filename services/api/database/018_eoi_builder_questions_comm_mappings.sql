-- Migration 018: Create expressions_of_interest, builder_questions,
-- eoi_question_answers, and opportunity_comm_mappings tables.

-- 1. Expressions of Interest
CREATE TABLE IF NOT EXISTS expressions_of_interest (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    investment_amount   NUMERIC(15,2),
    num_units           INTEGER,
    investment_timeline VARCHAR(50),
    funding_source      VARCHAR(50),
    purpose             VARCHAR(50),
    preferred_contact   VARCHAR(30),
    best_time_to_contact VARCHAR(50),
    communication_consent BOOLEAN DEFAULT TRUE,
    additional_notes    TEXT,
    status              VARCHAR(30) NOT NULL DEFAULT 'submitted',
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_eoi_user_id ON expressions_of_interest(user_id);
CREATE INDEX IF NOT EXISTS ix_eoi_opportunity_id ON expressions_of_interest(opportunity_id);
CREATE INDEX IF NOT EXISTS ix_eoi_status ON expressions_of_interest(status);

-- 2. Builder Questions
CREATE TABLE IF NOT EXISTS builder_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    creator_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    question_type   VARCHAR(30) NOT NULL DEFAULT 'text',
    options         JSONB,
    is_required     BOOLEAN DEFAULT TRUE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_builder_questions_opportunity_id ON builder_questions(opportunity_id);

-- 3. EOI Question Answers
CREATE TABLE IF NOT EXISTS eoi_question_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eoi_id          UUID NOT NULL REFERENCES expressions_of_interest(id) ON DELETE CASCADE,
    question_id     UUID NOT NULL REFERENCES builder_questions(id) ON DELETE CASCADE,
    answer_text     TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_eoi_qa_eoi_id ON eoi_question_answers(eoi_id);

-- 4. Opportunity Comm Mappings
CREATE TABLE IF NOT EXISTS opportunity_comm_mappings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role            VARCHAR(30) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT uq_comm_mapping_opp_user_role UNIQUE (opportunity_id, user_id, role)
);
CREATE INDEX IF NOT EXISTS ix_comm_mappings_opportunity_id ON opportunity_comm_mappings(opportunity_id);
