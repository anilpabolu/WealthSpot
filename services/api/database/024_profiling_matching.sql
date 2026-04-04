-- =============================================================================
-- Migration 024: Vault Profiling, Dynamic Questions & Profile Matching
-- =============================================================================
-- Adds:
--   1. vault_profile_questions   – platform-level profiling questions per vault
--   2. user_profile_answers      – each user's answers to profiling questions
--   3. opportunity_custom_questions – creator-defined questions when creating an opportunity
--   4. opportunity_application_answers – applicant's answers to custom questions
--   5. profile_match_scores      – cached match scores between users & opportunities
--   6. personality_dimensions    – computed personality vectors per user
-- =============================================================================

BEGIN;

-- ─── 1. Vault Profiling Questions ──────────────────────────────────────────
-- These are the "onboarding into vault" questions — asked once when a user
-- joins a vault, used for personality profiling & match scoring.

CREATE TABLE IF NOT EXISTS vault_profile_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_type      VARCHAR(20)  NOT NULL,                       -- wealth | opportunity | community
    category        VARCHAR(50)  NOT NULL DEFAULT 'general',     -- personality | financial | skills | creative | risk
    question_text   TEXT         NOT NULL,
    question_type   VARCHAR(20)  NOT NULL DEFAULT 'choice',      -- choice | multi_choice | scale | text | slider
    options         JSONB,                                       -- for choice/multi_choice: [{value, label, weight, emoji}]
    weight          NUMERIC(4,2) NOT NULL DEFAULT 1.0,           -- importance weight for scoring
    dimension       VARCHAR(50),                                 -- which personality dimension this maps to
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    is_required     BOOLEAN      NOT NULL DEFAULT TRUE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    fun_fact        TEXT,                                        -- optional fun fact shown after answering
    illustration    VARCHAR(50),                                 -- illustration key (rocket, brain, handshake, etc.)
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_vpq_vault_active ON vault_profile_questions (vault_type, is_active, sort_order);

-- ─── 2. User Profile Answers ───────────────────────────────────────────────
-- Stores each user's responses to vault profiling questions.

CREATE TABLE IF NOT EXISTS user_profile_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id     UUID         NOT NULL REFERENCES vault_profile_questions(id) ON DELETE CASCADE,
    vault_type      VARCHAR(20)  NOT NULL,
    answer_value    JSONB        NOT NULL,        -- flexible: string, array, number
    answer_score    NUMERIC(5,2),                 -- computed score from weight × option-weight
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX idx_upa_user_vault ON user_profile_answers (user_id, vault_type);

-- ─── 3. Opportunity Custom Questions ───────────────────────────────────────
-- When a creator makes a community vault opportunity, they define custom
-- questions that applicants must answer. These questions are contextual —
-- the system also auto-generates questions based on the opportunity description.

CREATE TABLE IF NOT EXISTS opportunity_custom_questions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id  UUID         NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    creator_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_text   TEXT         NOT NULL,
    question_type   VARCHAR(20)  NOT NULL DEFAULT 'text',   -- text | choice | multi_choice | scale | file
    options         JSONB,                                  -- [{value, label, weight}]
    weight          NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    dimension       VARCHAR(50),
    sort_order      INTEGER      NOT NULL DEFAULT 0,
    is_required     BOOLEAN      NOT NULL DEFAULT TRUE,
    is_auto_generated BOOLEAN    NOT NULL DEFAULT FALSE,    -- TRUE if system-generated from opportunity desc
    source_hint     TEXT,                                   -- why this was auto-generated
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_ocq_opportunity ON opportunity_custom_questions (opportunity_id, sort_order);

-- ─── 4. Opportunity Application Answers ────────────────────────────────────
-- When a user applies to an opportunity (community vault), they answer
-- the creator's custom questions. Stored separately from vault profile answers.

CREATE TABLE IF NOT EXISTS opportunity_application_answers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id  UUID         NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    question_id     UUID         NOT NULL REFERENCES opportunity_custom_questions(id) ON DELETE CASCADE,
    answer_value    JSONB        NOT NULL,
    answer_score    NUMERIC(5,2),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, question_id)
);

CREATE INDEX idx_oaa_user_opp ON opportunity_application_answers (user_id, opportunity_id);

-- ─── 5. Profile Match Scores ───────────────────────────────────────────────
-- Cached composite match score between a user and an opportunity.
-- Recomputed on profile-answer updates or when new opportunities appear.

CREATE TABLE IF NOT EXISTS profile_match_scores (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id  UUID         NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    overall_score   NUMERIC(5,2) NOT NULL DEFAULT 0,         -- 0-100 match percentage
    dimension_scores JSONB       NOT NULL DEFAULT '{}',      -- {"risk": 85, "domain": 72, ...}
    breakdown       JSONB,                                   -- detailed human-readable breakdown
    computed_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, opportunity_id)
);

CREATE INDEX idx_pms_opportunity_score ON profile_match_scores (opportunity_id, overall_score DESC);
CREATE INDEX idx_pms_user ON profile_match_scores (user_id);

-- ─── 6. Personality Dimensions (derived, per user per vault) ───────────────
-- Aggregated personality vector computed from vault_profile_answers.

CREATE TABLE IF NOT EXISTS personality_dimensions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vault_type      VARCHAR(20)  NOT NULL,
    risk_appetite       NUMERIC(5,2) DEFAULT 0,   -- 0-100
    domain_expertise    NUMERIC(5,2) DEFAULT 0,   -- 0-100
    investment_capacity NUMERIC(5,2) DEFAULT 0,   -- 0-100
    time_commitment     NUMERIC(5,2) DEFAULT 0,   -- 0-100
    network_strength    NUMERIC(5,2) DEFAULT 0,   -- 0-100
    creativity_score    NUMERIC(5,2) DEFAULT 0,   -- 0-100
    leadership_score    NUMERIC(5,2) DEFAULT 0,   -- 0-100
    collaboration_score NUMERIC(5,2) DEFAULT 0,   -- 0-100
    raw_dimensions      JSONB NOT NULL DEFAULT '{}',  -- full dimensional vector
    computed_at         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE(user_id, vault_type)
);

CREATE INDEX idx_pd_user ON personality_dimensions (user_id);

COMMIT;

-- =============================================================================
-- Seed: Default Vault Profiling Questions
-- =============================================================================

BEGIN;

-- ── WEALTH VAULT Questions (structured, financial) ──────────────────────────

INSERT INTO vault_profile_questions (vault_type, category, question_text, question_type, options, weight, dimension, sort_order, fun_fact, illustration) VALUES

-- Risk & Financial
('wealth', 'financial', 'What''s your annual investment budget?', 'choice',
 '[{"value":"under_5l","label":"Under ₹5 Lakh","weight":0.3,"emoji":"🌱"},{"value":"5l_25l","label":"₹5L – ₹25 Lakh","weight":0.6,"emoji":"🌿"},{"value":"25l_1cr","label":"₹25L – ₹1 Crore","weight":0.85,"emoji":"🌳"},{"value":"above_1cr","label":"Above ₹1 Crore","weight":1.0,"emoji":"🏔️"}]',
 1.5, 'investment_capacity', 1, '80% of Indian HNIs prefer real estate as their primary asset class!', 'coins'),

('wealth', 'risk', 'How do you react when your investment drops 20% in a month?', 'choice',
 '[{"value":"panic_sell","label":"Sell immediately — protect capital","weight":0.2,"emoji":"😰"},{"value":"anxious_hold","label":"Worried but hold tight","weight":0.5,"emoji":"😟"},{"value":"calm_hold","label":"Stay calm, it''ll recover","weight":0.8,"emoji":"😌"},{"value":"buy_more","label":"Time to buy the dip!","weight":1.0,"emoji":"🤑"}]',
 1.8, 'risk_appetite', 2, 'Warren Buffett says "Be fearful when others are greedy, and greedy when others are fearful."', 'mountain'),

('wealth', 'financial', 'What''s your preferred investment horizon?', 'choice',
 '[{"value":"under_1y","label":"Under 1 year","weight":0.3,"emoji":"⚡"},{"value":"1_3y","label":"1–3 years","weight":0.6,"emoji":"🏃"},{"value":"3_7y","label":"3–7 years","weight":0.85,"emoji":"🚀"},{"value":"above_7y","label":"7+ years","weight":1.0,"emoji":"🌅"}]',
 1.2, 'investment_capacity', 3, 'Real estate historically delivers best returns in 5-10 year cycles.', 'calendar'),

('wealth', 'personality', 'Which best describes your investment style?', 'choice',
 '[{"value":"conservative","label":"Safety first — steady returns","weight":0.3,"emoji":"🛡️"},{"value":"balanced","label":"Mix of stable & growth","weight":0.6,"emoji":"⚖️"},{"value":"growth","label":"Higher risk, higher reward","weight":0.85,"emoji":"📈"},{"value":"aggressive","label":"Moon or bust!","weight":1.0,"emoji":"🚀"}]',
 1.5, 'risk_appetite', 4, NULL, 'shield'),

('wealth', 'skills', 'What''s your expertise in real estate?', 'choice',
 '[{"value":"novice","label":"Complete beginner","weight":0.2,"emoji":"🐣"},{"value":"basic","label":"Know the basics","weight":0.5,"emoji":"📚"},{"value":"intermediate","label":"Invested before","weight":0.8,"emoji":"🏠"},{"value":"expert","label":"Real estate pro","weight":1.0,"emoji":"🏗️"}]',
 1.0, 'domain_expertise', 5, NULL, 'book'),

('wealth', 'personality', 'How important is passive income vs capital gains to you?', 'slider',
 '{"min":0,"max":100,"minLabel":"Only Rental Income 🏡","maxLabel":"Only Capital Gains 📈","step":10}',
 0.8, 'risk_appetite', 6, 'A balanced portfolio typically has 60% growth + 40% income assets.', 'balance'),

-- ── COMMUNITY VAULT Questions (creative, fun, personality-driven) ──────────

('community', 'creative', 'If your investment style were a superhero, who would it be?', 'choice',
 '[{"value":"iron_man","label":"Iron Man — strategic, tech-savvy, big bets","weight":0.9,"emoji":"🦾"},{"value":"captain","label":"Captain America — reliable, team player, long-term","weight":0.7,"emoji":"🛡️"},{"value":"spider_man","label":"Spider-Man — agile, community-driven, scrappy","weight":0.6,"emoji":"🕷️"},{"value":"hulk","label":"Hulk — all-in, high risk, high reward","weight":1.0,"emoji":"💪"}]',
 1.0, 'risk_appetite', 1, 'Fun fact: 73% of community investors identify as "Captain America" types!', 'superhero'),

('community', 'creative', 'You have ₹10L and 1 year. What do you build?', 'choice',
 '[{"value":"cafe","label":"A cozy community café ☕","weight":0.7,"emoji":"☕"},{"value":"sports","label":"A neighbourhood sports complex 🏏","weight":0.8,"emoji":"🏏"},{"value":"cowork","label":"A vibrant co-working space 💻","weight":0.75,"emoji":"💻"},{"value":"farm","label":"An urban farming project 🌾","weight":0.65,"emoji":"🌾"},{"value":"something_wild","label":"Something nobody''s thought of! 🤯","weight":1.0,"emoji":"🤯"}]',
 1.3, 'creativity_score', 2, 'The most successful community projects are driven by passion, not just profit!', 'lightbulb'),

('community', 'personality', 'In a group project, you''re usually the...', 'choice',
 '[{"value":"leader","label":"Leader — I rally the troops 🎯","weight":1.0,"emoji":"🎯"},{"value":"executor","label":"Executor — I get things done 🔨","weight":0.85,"emoji":"🔨"},{"value":"networker","label":"Connector — I know everyone 🤝","weight":0.8,"emoji":"🤝"},{"value":"thinker","label":"Strategist — I plan the play 🧠","weight":0.9,"emoji":"🧠"},{"value":"cheerleader","label":"Motivator — I keep spirits high 🎉","weight":0.7,"emoji":"🎉"}]',
 1.5, 'leadership_score', 3, NULL, 'team'),

('community', 'skills', 'What superpower do you bring to a partnership?', 'multi_choice',
 '[{"value":"money","label":"Capital 💰","weight":1.0},{"value":"time","label":"Time & Effort ⏰","weight":0.9},{"value":"network","label":"Connections & Network 🌐","weight":0.85},{"value":"expertise","label":"Domain Knowledge 📚","weight":0.95},{"value":"marketing","label":"Marketing & Branding 📣","weight":0.8},{"value":"tech","label":"Technology & Tools 💻","weight":0.9},{"value":"operations","label":"Operations & Management 📋","weight":0.85}]',
 1.4, 'collaboration_score', 4, 'The best partnerships have complementary superpowers!', 'stars'),

('community', 'creative', 'Your dream partnership motto?', 'choice',
 '[{"value":"move_fast","label":"Move fast, break things 🚀","weight":0.8,"emoji":"🚀"},{"value":"slow_steady","label":"Slow and steady wins the race 🐢","weight":0.6,"emoji":"🐢"},{"value":"think_big","label":"Think big, think different 💡","weight":0.9,"emoji":"💡"},{"value":"people_first","label":"People first, profit follows ❤️","weight":0.75,"emoji":"❤️"},{"value":"data_driven","label":"Data doesn''t lie 📊","weight":0.85,"emoji":"📊"}]',
 1.0, 'risk_appetite', 5, NULL, 'rocket'),

('community', 'personality', 'How many hours/week can you commit to a project?', 'choice',
 '[{"value":"0_2","label":"1-2 hours (I''m busy but interested)","weight":0.3,"emoji":"⏱️"},{"value":"3_5","label":"3-5 hours (weekends warrior)","weight":0.5,"emoji":"🗓️"},{"value":"5_15","label":"5-15 hours (part-time commitment)","weight":0.8,"emoji":"⚡"},{"value":"15_plus","label":"15+ hours (let''s go all in!)","weight":1.0,"emoji":"🔥"}]',
 1.3, 'time_commitment', 6, 'Most successful community projects need at least 5-10 hours/week from core team members.', 'clock'),

('community', 'personality', 'How big is your local network?', 'choice',
 '[{"value":"tight","label":"Small but tight-knit circle","weight":0.4,"emoji":"👨‍👩‍👧‍👦"},{"value":"moderate","label":"Know a good bunch of people","weight":0.6,"emoji":"🤝"},{"value":"wide","label":"I''m pretty well-connected","weight":0.8,"emoji":"🌐"},{"value":"massive","label":"I know EVERYONE in my community","weight":1.0,"emoji":"🏙️"}]',
 1.1, 'network_strength', 7, 'The strongest communities start with just 12-15 passionate people.', 'globe'),

('community', 'financial', 'How much can you invest in a community project?', 'choice',
 '[{"value":"under_50k","label":"Under ₹50,000","weight":0.3,"emoji":"🌱"},{"value":"50k_2l","label":"₹50K – ₹2 Lakh","weight":0.5,"emoji":"🌿"},{"value":"2l_10l","label":"₹2L – ₹10 Lakh","weight":0.8,"emoji":"🌳"},{"value":"above_10l","label":"₹10 Lakh+","weight":1.0,"emoji":"🏔️"}]',
 1.2, 'investment_capacity', 8, NULL, 'piggybank'),

-- ── OPPORTUNITY VAULT Questions (startup/venture focused) ───────────────────

('opportunity', 'financial', 'What stage of startups excites you most?', 'choice',
 '[{"value":"pre_seed","label":"Pre-seed — ground zero 🌱","weight":1.0,"emoji":"🌱"},{"value":"seed","label":"Seed — proof of concept 🌿","weight":0.85,"emoji":"🌿"},{"value":"series_a","label":"Series A — scaling up 🚀","weight":0.7,"emoji":"🚀"},{"value":"growth","label":"Growth — proven winners 📈","weight":0.5,"emoji":"📈"}]',
 1.3, 'risk_appetite', 1, 'Pre-seed investments have the highest risk but also the highest potential returns!', 'seed'),

('opportunity', 'skills', 'Which industries do you understand deeply?', 'multi_choice',
 '[{"value":"tech","label":"Technology 💻","weight":0.9},{"value":"fintech","label":"Fintech 🏦","weight":0.9},{"value":"healthcare","label":"Healthcare 🏥","weight":0.85},{"value":"education","label":"EdTech 📚","weight":0.8},{"value":"consumer","label":"Consumer & D2C 🛍️","weight":0.8},{"value":"sustainability","label":"Climate & Sustainability 🌍","weight":0.85},{"value":"ai_ml","label":"AI & Deep Tech 🤖","weight":0.95},{"value":"logistics","label":"Logistics & Supply Chain 🚛","weight":0.75}]',
 1.4, 'domain_expertise', 2, NULL, 'industry'),

('opportunity', 'personality', 'How involved do you want to be with founders?', 'choice',
 '[{"value":"silent","label":"Silent investor — just returns","weight":0.3,"emoji":"🤫"},{"value":"advisory","label":"Help when asked — advisory","weight":0.6,"emoji":"💡"},{"value":"active","label":"Active mentor — regular calls","weight":0.85,"emoji":"📞"},{"value":"hands_on","label":"Hands-on partner — co-build","weight":1.0,"emoji":"🤝"}]',
 1.2, 'collaboration_score', 3, NULL, 'handshake'),

('opportunity', 'risk', 'What''s your risk comfort with startup investments?', 'choice',
 '[{"value":"low","label":"Low — only if well-backed","weight":0.3,"emoji":"🔒"},{"value":"moderate","label":"Moderate — willing to take calculated risks","weight":0.6,"emoji":"🎲"},{"value":"high","label":"High — comfortable with uncertainty","weight":0.85,"emoji":"🎢"},{"value":"yolo","label":"YOLO — this is the way","weight":1.0,"emoji":"🚀"}]',
 1.5, 'risk_appetite', 4, '90% of startups fail, but the 10% that succeed can return 100x.', 'dice');

COMMIT;
