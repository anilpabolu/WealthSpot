-- 044_safe_vault_profiling.sql
-- Safe Vault Profiling: add 10 vault-specific fixed income profiling questions.
-- Soft-deletes legacy vault_type='opportunity' questions (rebranded in migration 014).

BEGIN;

-- Deactivate legacy 'opportunity' questions (they never applied to safe vault)
UPDATE vault_profile_questions
SET is_active = false
WHERE vault_type = 'opportunity' AND is_active = true;

-- ============================================================================
--  SAFE VAULT -- 10 questions across 3 categories (screens)
-- ============================================================================

-- Screen 1: Fixed Income Profile (3 questions)
INSERT INTO vault_profile_questions
  (id, vault_type, category, question_text, question_type, options, weight, dimension, sort_order, fun_fact, illustration, is_active)
VALUES
(gen_random_uuid(), 'safe', 'fixed_income_profile',
 'What best describes your investment mindset?', 'choice',
 '[{"value":"preserve_capital","label":"Safety above all — always preserve capital","emoji":"🛡️","weight":0.2},{"value":"steady_income","label":"Steady growth with predictable income","emoji":"📊","weight":0.5},{"value":"balanced","label":"Balance safety with enhanced returns","emoji":"⚖️","weight":0.75},{"value":"yield_optimize","label":"Optimise yield while managing risk carefully","emoji":"🎯","weight":1.0}]',
 1.0, 'risk_appetite', 1,
 'Fixed income investors in India earned an average 10.2% p.a. from mortgage-backed instruments in FY24.',
 'shield', true),

(gen_random_uuid(), 'safe', 'fixed_income_profile',
 'What''s your preferred investment lock-in period?', 'choice',
 '[{"value":"very_short","label":"Under 6 months — liquidity first","emoji":"⚡","weight":0.2},{"value":"short","label":"6–12 months — short commitment","emoji":"📅","weight":0.5},{"value":"medium","label":"1–3 years — medium-term income","emoji":"🏗️","weight":0.8},{"value":"long","label":"3+ years — long-term compounding","emoji":"👑","weight":1.0}]',
 1.0, 'time_commitment', 2,
 'Longer tenor bonds in India command 1.5–2% higher annual yields than short-term instruments.',
 'calendar', true),

(gen_random_uuid(), 'safe', 'fixed_income_profile',
 'What annual return would fully satisfy your Safe Vault goals?', 'choice',
 '[{"value":"conservative","label":"7–9% p.a. — stability over returns","emoji":"💰","weight":0.3},{"value":"moderate","label":"9–11% p.a. — steady compounding","emoji":"📈","weight":0.6},{"value":"enhanced","label":"11–13% p.a. — enhanced fixed yield","emoji":"🚀","weight":0.8},{"value":"maximum","label":"13%+ p.a. — maximise fixed income returns","emoji":"🏆","weight":1.0}]',
 1.0, 'investment_capacity', 3,
 'Top-rated mortgage-backed instruments on WealthSpot offer 9–13% p.a. with monthly payouts.',
 'coins', true);

-- Screen 2: Security & Due Diligence (3 questions)
INSERT INTO vault_profile_questions
  (id, vault_type, category, question_text, question_type, options, weight, dimension, sort_order, fun_fact, illustration, is_active)
VALUES
(gen_random_uuid(), 'safe', 'security_preferences',
 'Which collateral types give you maximum confidence?', 'multi_choice',
 '[{"value":"residential_mortgage","label":"Mortgage on residential property","emoji":"🏠","weight":0.7},{"value":"commercial_mortgage","label":"Mortgage on commercial property","emoji":"🏬","weight":0.9},{"value":"listed_debentures","label":"Listed company debentures","emoji":"📜","weight":0.7},{"value":"promoter_guarantee","label":"Personal guarantee by promoter","emoji":"🤝","weight":0.5},{"value":"govt_security","label":"Government-linked security","emoji":"🏛️","weight":0.6},{"value":"post_dated_cheques","label":"Post-dated cheques & NACH mandate","emoji":"🔏","weight":0.4}]',
 1.0, 'domain_expertise', 4,
 'Mortgage-backed lending has under 2% default rate in India vs 5%+ for unsecured corporate loans.',
 'lock', true),

(gen_random_uuid(), 'safe', 'security_preferences',
 'How experienced are you with fixed income investing?', 'choice',
 '[{"value":"beginner","label":"Just starting — FDs are my comfort zone","emoji":"🌱","weight":0.2},{"value":"some_knowledge","label":"I know bonds and NCDs, exploring more","emoji":"📖","weight":0.5},{"value":"experienced","label":"Comfortable with debentures, P2P, structured debt","emoji":"😎","weight":0.8},{"value":"expert","label":"Seasoned — done multiple structured deals","emoji":"🦅","weight":1.0}]',
 1.0, 'domain_expertise', 5,
 'Only 12% of retail investors in India have explored fixed income beyond bank FDs.',
 'book', true),

(gen_random_uuid(), 'safe', 'security_preferences',
 'Your top priority when selecting a fixed income deal?', 'multi_choice',
 '[{"value":"collateral_ltv","label":"Strong collateral coverage (LTV)","emoji":"🛡️","weight":0.3},{"value":"borrower_quality","label":"Borrower credit quality & track record","emoji":"🏢","weight":0.6},{"value":"return_rate","label":"Interest rate and return on investment","emoji":"📊","weight":0.8},{"value":"payout_frequency","label":"Payout frequency and liquidity","emoji":"⏱️","weight":0.5},{"value":"regulatory","label":"RERA registration or regulatory compliance","emoji":"📋","weight":0.4},{"value":"diversification","label":"Diversification across sectors","emoji":"🎯","weight":0.7}]',
 1.0, 'risk_appetite', 6,
 'Investors who diversify across 5+ fixed income deals reduce their default risk by 60%.',
 'balance', true);

-- Screen 3: Income & Portfolio Strategy (4 questions)
INSERT INTO vault_profile_questions
  (id, vault_type, category, question_text, question_type, options, weight, dimension, sort_order, fun_fact, illustration, is_active)
VALUES
(gen_random_uuid(), 'safe', 'income_strategy',
 'How do you prefer receiving your investment returns?', 'choice',
 '[{"value":"monthly","label":"Monthly payouts — steady cash flow","emoji":"💸","weight":0.8},{"value":"quarterly","label":"Quarterly payouts — periodic income","emoji":"📆","weight":0.7},{"value":"maturity","label":"Compounded at maturity — maximise growth","emoji":"🏦","weight":1.0},{"value":"flexible","label":"Flexible — whatever suits the deal","emoji":"🔄","weight":0.5}]',
 1.0, 'time_commitment', 7,
 'Monthly payout structures help reinvest earlier, boosting effective yield by 0.3–0.5% p.a.',
 'clock', true),

(gen_random_uuid(), 'safe', 'income_strategy',
 'What''s your primary motivation for Safe Vault investing?', 'multi_choice',
 '[{"value":"emergency_fund","label":"Emergency fund enhancement","emoji":"🏥","weight":0.4},{"value":"income_stream","label":"Supplementary income stream","emoji":"💼","weight":0.7},{"value":"portfolio_diversify","label":"Diversifying an equity-heavy portfolio","emoji":"🎯","weight":0.8},{"value":"retirement_capital","label":"Capital preservation before retirement","emoji":"🌱","weight":0.5},{"value":"passive_income","label":"Building passive income streams","emoji":"🏡","weight":0.9},{"value":"tax_efficient","label":"Tax-efficient wealth growth","emoji":"📊","weight":0.6}]',
 1.0, 'investment_capacity', 8,
 'Portfolios with 30–40% fixed income allocation showed 40% less volatility during the 2020 market crash.',
 'goal', true),

(gen_random_uuid(), 'safe', 'income_strategy',
 'What Loan-to-Value ratio are you comfortable with?', 'choice',
 '[{"value":"ultra_conservative","label":"Up to 50% LTV — ultra conservative","emoji":"🔒","weight":0.2},{"value":"balanced","label":"50–65% LTV — balanced security","emoji":"⚖️","weight":0.5},{"value":"standard","label":"65–75% LTV — standard industry practice","emoji":"🏗️","weight":0.7},{"value":"growth","label":"Up to 80% LTV — I trust quality projects","emoji":"📈","weight":0.9}]',
 1.0, 'risk_appetite', 9,
 'Industry-standard LTV for mortgage-backed securities in India is 65–70%, ensuring a 30–35% buffer.',
 'shield', true),

(gen_random_uuid(), 'safe', 'income_strategy',
 'What share of your portfolio do you plan for Safe Vault?', 'choice',
 '[{"value":"testing","label":"Under 10% — testing the waters","emoji":"💡","weight":0.2},{"value":"meaningful","label":"10–25% — meaningful diversification","emoji":"📊","weight":0.5},{"value":"significant","label":"25–50% — significant fixed income focus","emoji":"💪","weight":0.8},{"value":"core","label":"50%+ — core of my income strategy","emoji":"🏰","weight":1.0}]',
 1.0, 'investment_capacity', 10,
 'Institutional investors globally maintain 35–45% fixed income allocation for portfolio stability.',
 'portfolio', true);

COMMIT;
