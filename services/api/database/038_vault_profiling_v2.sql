-- 038_vault_profiling_v2.sql
-- Vault Profiling V2: Replace old seed questions with vault-specific, choice-based questions.
-- Groups questions into 2 categories per vault (3 per category = 2 screens of 3).

BEGIN;

-- 1. Soft-delete all existing seed questions (preserves answers for audit)
UPDATE vault_profile_questions SET is_active = false WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════
--  WEALTH VAULT — 6 questions (2 categories × 3)
-- ═══════════════════════════════════════════════════════════════════════════

-- Screen 1: Investment Profile
INSERT INTO vault_profile_questions (id, vault_type, question_key, question_text, question_type, options, weight, dimension, display_order, fun_fact, illustration, category, is_active)
VALUES
(gen_random_uuid(), 'wealth', 'w_investment_driver', 'What drives your real estate investment interest?', 'choice',
 '[{"value":"passive_income","label":"Passive rental income","emoji":"🏠","weight":0.7},{"value":"capital_growth","label":"Long-term capital appreciation","emoji":"📈","weight":0.8},{"value":"portfolio_diversify","label":"Diversifying my portfolio beyond stocks","emoji":"⚖️","weight":0.6},{"value":"tangible_asset","label":"Owning tangible, real assets","emoji":"🏛️","weight":0.5}]',
 1.0, 'risk_appetite', 1, 'Real estate has outperformed stocks in 12 of the last 20 years in India.', 'coins', 'investment_profile', true),

(gen_random_uuid(), 'wealth', 'w_investment_horizon', 'What''s your ideal investment horizon?', 'choice',
 '[{"value":"short","label":"1–3 years (quick returns)","emoji":"⚡","weight":0.4},{"value":"medium","label":"3–7 years (balanced growth)","emoji":"📊","weight":0.7},{"value":"long","label":"7–15 years (wealth building)","emoji":"🏗️","weight":0.9},{"value":"very_long","label":"15+ years (generational wealth)","emoji":"👑","weight":1.0}]',
 1.0, 'investment_capacity', 2, 'The average holding period for top-performing real estate investors is 7–10 years.', 'calendar', 'investment_profile', true),

(gen_random_uuid(), 'wealth', 'w_risk_reaction', 'If your investment dipped 20%, your first instinct?', 'choice',
 '[{"value":"buy_more","label":"Buy more at the dip!","emoji":"🤑","weight":1.0},{"value":"hold_steady","label":"Hold steady and wait it out","emoji":"🧘","weight":0.7},{"value":"research","label":"Research what happened before deciding","emoji":"🔍","weight":0.5},{"value":"cut_losses","label":"Cut losses and move on","emoji":"🏃","weight":0.2}]',
 1.0, 'risk_appetite', 3, '80% of successful investors hold through downturns rather than panic-selling.', 'shield', 'investment_profile', true);

-- Screen 2: Real Estate DNA
INSERT INTO vault_profile_questions (id, vault_type, question_key, question_text, question_type, options, weight, dimension, display_order, fun_fact, illustration, category, is_active)
VALUES
(gen_random_uuid(), 'wealth', 'w_property_types', 'Which property types excite you?', 'multi_choice',
 '[{"value":"residential","label":"Residential apartments","emoji":"🏢","weight":0.6},{"value":"commercial","label":"Commercial offices","emoji":"🏬","weight":0.8},{"value":"warehousing","label":"Warehousing & logistics","emoji":"📦","weight":0.7},{"value":"retail","label":"Retail spaces","emoji":"🛍️","weight":0.5},{"value":"plots","label":"Land / Plots","emoji":"🌿","weight":0.9},{"value":"co_living","label":"Co-living / Student housing","emoji":"🎓","weight":0.6}]',
 1.0, 'domain_expertise', 4, 'Warehousing has been the fastest-growing real estate segment in India, growing 25% YoY.', 'industry', 'real_estate_dna', true),

(gen_random_uuid(), 'wealth', 'w_re_familiarity', 'How familiar are you with real estate investing?', 'choice',
 '[{"value":"beginner","label":"Complete beginner — teach me everything","emoji":"🌱","weight":0.2},{"value":"some_knowledge","label":"I know the basics, exploring more","emoji":"📖","weight":0.5},{"value":"experienced","label":"I''ve invested in 1–3 properties","emoji":"🏠","weight":0.8},{"value":"expert","label":"Seasoned investor with 4+ properties","emoji":"🏆","weight":1.0}]',
 1.0, 'domain_expertise', 5, 'Only 6% of Indian millennials have invested in real estate — you''re ahead of the curve!', 'book', 'real_estate_dna', true),

(gen_random_uuid(), 'wealth', 'w_location_pref', 'Where do you prefer investing?', 'multi_choice',
 '[{"value":"tier1","label":"Tier 1 metros (Mumbai, Delhi, Bangalore)","emoji":"🌆","weight":0.7},{"value":"tier2","label":"Tier 2 cities (Pune, Hyderabad, Chennai)","emoji":"🏙️","weight":0.6},{"value":"emerging","label":"Emerging micro-markets","emoji":"📍","weight":0.9},{"value":"vacation","label":"Vacation / Holiday destinations","emoji":"🏖️","weight":0.4},{"value":"international","label":"International markets","emoji":"🌏","weight":0.8}]',
 1.0, 'domain_expertise', 6, 'Tier 2 cities have shown 15-20% higher rental yields compared to metros in recent years.', 'globe', 'real_estate_dna', true);

-- ═══════════════════════════════════════════════════════════════════════════
--  OPPORTUNITY VAULT — 6 questions (2 categories × 3)
-- ═══════════════════════════════════════════════════════════════════════════

-- Screen 1: Venture Appetite
INSERT INTO vault_profile_questions (id, vault_type, question_key, question_text, question_type, options, weight, dimension, display_order, fun_fact, illustration, category, is_active)
VALUES
(gen_random_uuid(), 'opportunity', 'o_startup_stage', 'What startup stage gets your pulse racing?', 'choice',
 '[{"value":"pre_seed","label":"Pre-seed — raw ideas with massive potential","emoji":"💡","weight":1.0},{"value":"seed","label":"Seed — early traction, first users","emoji":"🌱","weight":0.8},{"value":"series_a","label":"Series A — proven product-market fit","emoji":"🚀","weight":0.6},{"value":"growth","label":"Growth stage — scaling machines","emoji":"📈","weight":0.4}]',
 1.0, 'risk_appetite', 1, 'Pre-seed investments have the highest risk but historically 100x return potential.', 'seed', 'venture_appetite', true),

(gen_random_uuid(), 'opportunity', 'o_sector_expertise', 'Which sectors do you understand deeply?', 'multi_choice',
 '[{"value":"fintech","label":"Fintech & Payments","emoji":"💳","weight":0.7},{"value":"healthtech","label":"Health & Biotech","emoji":"🧬","weight":0.8},{"value":"edtech","label":"EdTech & Skilling","emoji":"📚","weight":0.5},{"value":"saas","label":"SaaS & Enterprise","emoji":"☁️","weight":0.7},{"value":"d2c","label":"D2C & Consumer","emoji":"🛒","weight":0.6},{"value":"deeptech","label":"DeepTech & AI","emoji":"🤖","weight":0.9},{"value":"climate","label":"Climate & Sustainability","emoji":"🌍","weight":0.7}]',
 1.0, 'domain_expertise', 2, 'India''s startup ecosystem is the 3rd largest globally with 100+ unicorns.', 'rocket', 'venture_appetite', true),

(gen_random_uuid(), 'opportunity', 'o_involvement', 'How hands-on do you want to be with founders?', 'choice',
 '[{"value":"silent","label":"Silent investor — just the returns please","emoji":"🤫","weight":0.2},{"value":"advisor","label":"Strategic advisor — occasional guidance","emoji":"🎯","weight":0.6},{"value":"mentor","label":"Active mentor — regular check-ins","emoji":"🧑‍🏫","weight":0.8},{"value":"operator","label":"Co-pilot — deeply involved in operations","emoji":"👨‍✈️","weight":1.0}]',
 1.0, 'collaboration_score', 3, 'Startups with engaged angel investors are 3x more likely to reach Series A.', 'handshake', 'venture_appetite', true);

-- Screen 2: Risk & Conviction
INSERT INTO vault_profile_questions (id, vault_type, question_key, question_text, question_type, options, weight, dimension, display_order, fun_fact, illustration, category, is_active)
VALUES
(gen_random_uuid(), 'opportunity', 'o_risk_comfort', 'How comfortable are you with startup risk?', 'choice',
 '[{"value":"very_comfortable","label":"Bring it on — high risk, high reward","emoji":"🎲","weight":1.0},{"value":"comfortable","label":"Comfortable if I believe in the team","emoji":"🤝","weight":0.7},{"value":"cautious","label":"Cautious — I need strong data","emoji":"📊","weight":0.4},{"value":"conservative","label":"Conservative — prefer safer bets","emoji":"🛡️","weight":0.2}]',
 1.0, 'risk_appetite', 4, '90% of startups fail, but one winner can return 50x your portfolio.', 'dice', 'risk_conviction', true),

(gen_random_uuid(), 'opportunity', 'o_eval_criteria', 'What matters most when evaluating startups?', 'multi_choice',
 '[{"value":"team","label":"Founding team & vision","emoji":"👥","weight":0.8},{"value":"market","label":"Market size & timing","emoji":"📈","weight":0.7},{"value":"traction","label":"Revenue & traction","emoji":"💰","weight":0.6},{"value":"tech","label":"Technology & IP","emoji":"⚙️","weight":0.9},{"value":"impact","label":"Social impact","emoji":"🌱","weight":0.5},{"value":"unit_economics","label":"Unit economics","emoji":"🧮","weight":0.7}]',
 1.0, 'domain_expertise', 5, 'Top VCs say the #1 factor in startup success is the founding team, not the idea.', 'balance', 'risk_conviction', true),

(gen_random_uuid(), 'opportunity', 'o_startup_experience', 'Your experience with startup / alternative investments?', 'choice',
 '[{"value":"none","label":"First time — excited to start","emoji":"🌟","weight":0.2},{"value":"some","label":"Invested in 1–2 startups","emoji":"✌️","weight":0.5},{"value":"moderate","label":"Active angel with 3–5 investments","emoji":"😎","weight":0.8},{"value":"veteran","label":"Veteran investor with 5+ deals","emoji":"🦅","weight":1.0}]',
 1.0, 'investment_capacity', 6, 'Angel investors who invest in 10+ startups see 2.5x better returns than those with fewer.', 'stars', 'risk_conviction', true);

-- ═══════════════════════════════════════════════════════════════════════════
--  COMMUNITY VAULT — 6 questions (2 categories × 3)
-- ═══════════════════════════════════════════════════════════════════════════

-- Screen 1: Collaboration Style
INSERT INTO vault_profile_questions (id, vault_type, question_key, question_text, question_type, options, weight, dimension, display_order, fun_fact, illustration, category, is_active)
VALUES
(gen_random_uuid(), 'community', 'c_group_role', 'In group ventures, you naturally become the...', 'choice',
 '[{"value":"visionary","label":"Visionary — I see the big picture","emoji":"🔭","weight":1.0},{"value":"executor","label":"Executor — I get things done","emoji":"⚡","weight":0.8},{"value":"connector","label":"Connector — I bring people together","emoji":"🤝","weight":0.7},{"value":"analyst","label":"Analyst — I crunch the numbers","emoji":"🧮","weight":0.5}]',
 1.0, 'leadership_score', 1, 'The best teams combine visionaries and executors — which one are you?', 'superhero', 'collaboration_style', true),

(gen_random_uuid(), 'community', 'c_contribution', 'What can you contribute beyond capital?', 'multi_choice',
 '[{"value":"expertise","label":"Domain expertise & knowledge","emoji":"🧠","weight":0.7},{"value":"network","label":"Network & connections","emoji":"🌐","weight":0.8},{"value":"time","label":"Time & hands-on effort","emoji":"⏰","weight":0.6},{"value":"mentorship","label":"Mentorship & guidance","emoji":"🎓","weight":0.7},{"value":"marketing","label":"Marketing & visibility","emoji":"📢","weight":0.5},{"value":"operations","label":"Operations & management","emoji":"📋","weight":0.6}]',
 1.0, 'collaboration_score', 2, 'Community investors who contribute skills beyond capital see 40% better project outcomes.', 'team', 'collaboration_style', true),

(gen_random_uuid(), 'community', 'c_time_weekly', 'Hours per week you can dedicate to community projects?', 'choice',
 '[{"value":"minimal","label":"1–2 hours (passive involvement)","emoji":"☕","weight":0.2},{"value":"moderate","label":"3–5 hours (active participation)","emoji":"💪","weight":0.5},{"value":"significant","label":"5–10 hours (committed contributor)","emoji":"🔥","weight":0.8},{"value":"full","label":"10+ hours (community champion)","emoji":"🏆","weight":1.0}]',
 1.0, 'time_commitment', 3, 'Community members who invest 5+ hours weekly report 3x higher satisfaction.', 'clock', 'collaboration_style', true);

-- Screen 2: Community Vision
INSERT INTO vault_profile_questions (id, vault_type, question_key, question_text, question_type, options, weight, dimension, display_order, fun_fact, illustration, category, is_active)
VALUES
(gen_random_uuid(), 'community', 'c_project_interest', 'Which community projects excite you most?', 'multi_choice',
 '[{"value":"co_invest","label":"Co-investment clubs","emoji":"🤑","weight":0.7},{"value":"social_impact","label":"Social impact ventures","emoji":"🌱","weight":0.8},{"value":"local_business","label":"Local business support","emoji":"🏪","weight":0.5},{"value":"education","label":"Financial literacy programs","emoji":"📚","weight":0.6},{"value":"innovation","label":"Innovation & tech hubs","emoji":"💡","weight":0.9},{"value":"sustainability","label":"Sustainability projects","emoji":"♻️","weight":0.7}]',
 1.0, 'creativity_score', 4, 'Community-backed ventures have 60% higher success rates than solo investments.', 'lightbulb', 'community_vision', true),

(gen_random_uuid(), 'community', 'c_group_size', 'Your ideal group size for co-investing?', 'choice',
 '[{"value":"small","label":"2–5 people (tight-knit crew)","emoji":"🤙","weight":0.4},{"value":"medium","label":"5–15 people (diverse perspectives)","emoji":"👥","weight":0.7},{"value":"large","label":"15–50 (wisdom of the crowd)","emoji":"🏟️","weight":0.9},{"value":"open","label":"Open to all — the bigger the better","emoji":"🌊","weight":1.0}]',
 1.0, 'network_strength', 5, 'Investment syndicates of 10–20 members tend to make better collective decisions.', 'globe', 'community_vision', true),

(gen_random_uuid(), 'community', 'c_superpower', 'Your superpower in any partnership?', 'choice',
 '[{"value":"negotiation","label":"Negotiation & deal-making","emoji":"🎯","weight":0.9},{"value":"empathy","label":"Empathy & conflict resolution","emoji":"❤️","weight":0.6},{"value":"strategy","label":"Strategic thinking & planning","emoji":"♟️","weight":0.8},{"value":"energy","label":"Energy & motivation","emoji":"⚡","weight":0.7}]',
 1.0, 'network_strength', 6, 'The most valued co-investors are those who bring complementary superpowers to the table.', 'stars', 'community_vision', true);

COMMIT;
