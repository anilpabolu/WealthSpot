-- 029: Video toggle configs + CMS seed data for top 10 pages
-- Adds 4 per-category video toggle configs to platform_configs
-- Seeds ~80 site_content entries for the top 10 pages

-- ── Video Toggle Configs ────────────────────────────────────────────────────
INSERT INTO platform_configs (section, key, value, description) VALUES
  ('content', 'intro_videos_enabled',      '{"enabled": true}', 'Toggle intro/how-it-works videos on landing page and onboarding'),
  ('content', 'vault_videos_enabled',      '{"enabled": true}', 'Toggle vault intro and four-pillar videos on vaults page'),
  ('content', 'property_videos_enabled',   '{"enabled": true}', 'Toggle property tour / virtual walkthrough videos on opportunity detail'),
  ('content', 'video_management_enabled',  '{"enabled": true}', 'Toggle video management section in Control Centre for admins')
ON CONFLICT (section, key) DO NOTHING;


-- ── CMS Seed: Landing Page ──────────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  -- Hero
  ('landing', 'hero_badge',        'Curated access • trusted networks • strategic entry',                              'Hero badge text'),
  ('landing', 'hero_title',        'Private Access to Exceptional Real Asset Opportunities.',                           'Main hero heading'),
  ('landing', 'hero_subtitle',     'WealthSpot connects serious investors with curated, pre-vetted real estate deals — through a platform built on trust, discipline, and long-term value creation.', 'Hero subtitle paragraph'),
  ('landing', 'hero_italic',       'Where ambition meets access — and wealth finds its place.',                         'Hero italic line'),
  ('landing', 'hero_cta_primary',  'Request Private Access',                                                           'Primary CTA button text'),
  ('landing', 'hero_cta_secondary','Explore WealthSpot',                                                               'Secondary CTA button text'),
  -- Thesis Panel
  ('landing', 'thesis_label',      'WealthSpot Thesis',                                                                'Thesis panel label'),
  ('landing', 'thesis_badge',      'Private Market Mindset',                                                           'Thesis panel badge'),
  ('landing', 'thesis_heading',    'Where access, judgment, and trust align.',                                          'Thesis panel heading'),
  ('landing', 'thesis_core_belief','By positioning investors at the right point in the development cycle, with trusted builders and aligned incentives, outcomes improve — not by speculation, but by design.', 'Core Belief text'),
  ('landing', 'thesis_promise',    'WealthSpot does not exist to broker transactions. It exists to build a private investment culture, anchored in patience, transparency, and deep alignment between capital and capability.', 'Platform Promise text'),
  ('landing', 'thesis_gold',       'Capital alone is not enough. It is the combination of access, timing, relationships, and conviction that unlocks asymmetric opportunity.', 'Gold Highlight text'),
  -- Stats
  ('landing', 'stat_members',      'Platform Members',                                                                 'Stats bar label 1'),
  ('landing', 'stat_capital',      'Capital Deployed',                                                                 'Stats bar label 2'),
  ('landing', 'stat_opportunities','Live Opportunities',                                                               'Stats bar label 3'),
  ('landing', 'stat_markets',      'Markets Covered',                                                                  'Stats bar label 4'),
  ('landing', 'stat_investors',    'Verified Investors',                                                                'Stats bar label 5'),
  -- Closing CTA
  ('landing', 'closing_heading',   'Where access, judgment, and trust align, wealth has a better place to grow.',       'Closing CTA heading'),
  ('landing', 'closing_body',      'WealthSpot is a private access platform for disciplined participants who seek to build lasting, meaningful wealth — not through speculation, but through positioning, trust, and conviction.', 'Closing CTA body'),
  ('landing', 'closing_cta_1',     'Request Access',                                                                   'Closing CTA button 1'),
  ('landing', 'closing_cta_2',     'Review the Vaults',                                                                'Closing CTA button 2'),
  -- Intro Section
  ('landing', 'intro_label',       'Intro',                                                                            'Intro section label'),
  ('landing', 'intro_heading',     'Built for those who think beyond conventional investing.',                          'Intro section heading'),
  ('landing', 'intro_body_1',      'At its core, WealthSpot opens access to select real estate opportunities at earlier stages of value creation, where strategic entry, intrinsic value, and disciplined participation matter most.', 'Intro body paragraph 1'),
  ('landing', 'intro_body_2',      'This is not a marketplace for everyone. It is a platform for serious participation, trusted relationships, and intelligent wealth-building through capital, capability, and connections.', 'Intro body paragraph 2'),
  -- Why This Approach
  ('landing', 'approach_check_1',  'Access to earlier stages of value creation — before mass availability.',            'Why this approach check item 1'),
  ('landing', 'approach_check_2',  'Alignment with builders, co-investors, and partners who share intent.',             'Why this approach check item 2'),
  ('landing', 'approach_check_3',  'A private, trust-first platform that rewards judgment and patience.',               'Why this approach check item 3'),
  -- The Vaults Section
  ('landing', 'vaults_label',      'The Vaults',                                                                       'Vaults section label'),
  ('landing', 'vaults_heading',    'Three distinct entry points into the WealthSpot ecosystem.',                        'Vaults section heading'),
  -- Investor Identities Section
  ('landing', 'identities_label',  'Investor Identities',                                                              'Identities section label'),
  ('landing', 'identities_heading','Three ways to participate in value creation.',                                      'Identities section heading')
ON CONFLICT (page, section_tag) DO NOTHING;


-- ── CMS Seed: Marketplace Page ──────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('marketplace', 'hero_badge',    'Marketplace',                                                                      'Hero badge'),
  ('marketplace', 'hero_title',    'Property Marketplace',                                                             'Hero title'),
  ('marketplace', 'hero_subtitle', 'Discover RERA-verified investment opportunities across India''s top cities.',       'Hero subtitle'),
  ('marketplace', 'empty_title',   'Nothing here yet 🏗️',                                                              'Empty state title'),
  ('marketplace', 'empty_message', 'Tweak those filters — your next opportunity could be one click away.',              'Empty state message')
ON CONFLICT (page, section_tag) DO NOTHING;


-- ── CMS Seed: Vaults Page ───────────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('vaults', 'hero_badge',            'Three Vaults. Infinite Possibilities.',                                          'Hero badge'),
  ('vaults', 'hero_title',            'Pick Your Arena',                                                                'Hero title'),
  ('vaults', 'hero_subtitle',         'Each vault is designed for a different investment class — real estate, startups, or community ventures. Find the one that matches your ambition.', 'Hero subtitle'),
  ('vaults', 'pillars_label',         'The Four Pillars',                                                               'Pillars section label'),
  ('vaults', 'pillars_heading',       'Every Investor Has Something Unique to Offer',                                   'Pillars section heading'),
  ('vaults', 'pillars_subtitle',      'At WealthSpot, investing isn''t just about money. We recognise four types of investors — each contributing a different kind of capital to create outsized value together.', 'Pillars section subtitle'),
  ('vaults', 'video_error',           'Video could not be loaded',                                                      'Video error message'),
  ('vaults', 'video_retry',           'Retry',                                                                          'Video retry button text')
ON CONFLICT (page, section_tag) DO NOTHING;


-- ── CMS Seed: Investor Dashboard ────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('investor_dashboard', 'hero_badge',        'Investor Dashboard',                                                     'Hero badge'),
  ('investor_dashboard', 'hero_title',        'Welcome back 👋',                                                        'Hero title'),
  ('investor_dashboard', 'hero_subtitle',     'Here''s your portfolio overview — track your wealth journey in real time.', 'Hero subtitle'),
  ('investor_dashboard', 'section_txns',      'Recent Transactions',                                                    'Recent transactions heading'),
  ('investor_dashboard', 'section_reco',      'Recommended for You',                                                    'Recommendations heading'),
  ('investor_dashboard', 'section_actions',   'Quick Actions',                                                          'Quick actions heading'),
  ('investor_dashboard', 'empty_txns_title',  'No Transactions',                                                        'Empty transactions title'),
  ('investor_dashboard', 'empty_txns_msg',    'No transactions yet',                                                    'Empty transactions message')
ON CONFLICT (page, section_tag) DO NOTHING;


-- ── CMS Seed: Builder Dashboard ─────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('builder_dashboard', 'hero_badge',          'Builder Portal',                                                         'Hero badge'),
  ('builder_dashboard', 'hero_title',          'Builder Dashboard',                                                      'Hero title'),
  ('builder_dashboard', 'hero_subtitle',       'Manage your property listings and track investor activity.',              'Hero subtitle'),
  ('builder_dashboard', 'cta_add',             'Add New Property',                                                       'Add property CTA'),
  ('builder_dashboard', 'section_properties',  'My Properties',                                                          'Properties section heading'),
  ('builder_dashboard', 'empty_title',         'No Properties Yet',                                                      'Empty state title'),
  ('builder_dashboard', 'empty_message',       'Create your first listing!',                                             'Empty state message'),
  ('builder_dashboard', 'error_message',       'Failed to load dashboard data. Please try again later.',                  'Error message'),
  ('builder_dashboard', 'verify_title',        'Verification pending',                                                   'Verification notice title'),
  ('builder_dashboard', 'verify_message',      'Your builder profile is awaiting admin verification. Some features may be limited.', 'Verification notice message')
ON CONFLICT (page, section_tag) DO NOTHING;


-- ── CMS Seed: Community Page ────────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('community', 'hero_badge',         'Community',                                                                      'Hero badge'),
  ('community', 'hero_title',         'The Water Cooler',                                                               'Hero title'),
  ('community', 'hero_subtitle',      'Where investors swap alpha, share war stories, and ask the questions Google can''t answer.', 'Hero subtitle'),
  ('community', 'cta_discussion',     'New Discussion',                                                                 'New discussion button'),
  ('community', 'cta_question',       'Ask Question',                                                                   'Ask question button'),
  ('community', 'cta_insight',        'Share Insight',                                                                  'Share insight button'),
  ('community', 'empty_search_title', 'No Posts Found',                                                                 'Empty search title'),
  ('community', 'empty_search_msg',   'Try a different search term.',                                                   'Empty search message'),
  ('community', 'empty_title',        'No Posts Found',                                                                 'Empty state title'),
  ('community', 'empty_message',      'Be the first to start a discussion!',                                            'Empty state message')
ON CONFLICT (page, section_tag) DO NOTHING;


-- ── CMS Seed: Referral Page ────────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('referral', 'hero_badge',       'Referrals',                                                                        'Hero badge'),
  ('referral', 'hero_title',       'The Referral Hustle',                                                              'Hero title'),
  ('referral', 'hero_subtitle',    'Spread the word, stack the rewards. When your friend invests, you both pocket ₹250. Easy money.', 'Hero subtitle'),
  ('referral', 'code_label',       'Your Referral Code',                                                               'Referral code card label'),
  ('referral', 'hiw_heading',      'How It Works',                                                                     'How it works section heading'),
  ('referral', 'hiw_step1_title',  'Share Your Code',                                                                  'Step 1 title'),
  ('referral', 'hiw_step1_desc',   'Send your unique referral code to friends and family.',                             'Step 1 description'),
  ('referral', 'hiw_step2_title',  'Friend Signs Up',                                                                  'Step 2 title'),
  ('referral', 'hiw_step2_desc',   'They create an account using your referral link.',                                  'Step 2 description'),
  ('referral', 'hiw_step3_title',  'Both Earn ₹250',                                                                   'Step 3 title'),
  ('referral', 'hiw_step3_desc',   'When they make their first investment, you both get rewarded.',                     'Step 3 description'),
  ('referral', 'history_heading',  'Referral History',                                                                  'Referral history heading'),
  ('referral', 'empty_title',      'No Referrals Yet',                                                                 'Empty state title'),
  ('referral', 'empty_message',    'Your referral scoreboard is empty — time to rally the squad!',                      'Empty state message')
ON CONFLICT (page, section_tag) DO NOTHING;


-- ── CMS Seed: Portfolio Page ────────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('portfolio', 'hero_badge',       'Portfolio',                                                                        'Hero badge'),
  ('portfolio', 'hero_title',       'The War Chest',                                                                    'Hero title'),
  ('portfolio', 'hero_subtitle',    'Your empire-in-progress — every asset, every return, all in one place.',            'Hero subtitle'),
  ('portfolio', 'section_vaults',   'Vault-Wise Breakdown',                                                             'Vault breakdown heading'),
  ('portfolio', 'section_alloc',    'Asset Allocation',                                                                 'Allocation heading'),
  ('portfolio', 'section_returns',  'Monthly Returns',                                                                  'Returns heading'),
  ('portfolio', 'section_holdings', 'Holdings',                                                                         'Holdings heading'),
  ('portfolio', 'section_activity', 'Recent Activity',                                                                  'Activity heading'),
  ('portfolio', 'section_txns',     'Recent Transactions',                                                              'Transactions heading'),
  ('portfolio', 'empty_holdings',   'No Holdings Yet',                                                                  'Empty holdings title'),
  ('portfolio', 'empty_holdings_msg','Start investing to see your portfolio here.',                                     'Empty holdings message'),
  ('portfolio', 'empty_txns',       'No Transactions',                                                                  'Empty transactions title'),
  ('portfolio', 'empty_txns_msg',   'No transactions yet.',                                                             'Empty transactions message')
ON CONFLICT (page, section_tag) DO NOTHING;


-- ── CMS Seed: Onboarding Page ───────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('onboarding', 'ready_heading',   'You''re Ready!',                                                                  'Post-video heading'),
  ('onboarding', 'ready_subtitle',  'Your journey to building wealth through premium real estate starts now.',          'Post-video subtitle'),
  ('onboarding', 'ready_cta',       'Unlock My World of Opportunities',                                                'Post-video CTA button'),
  ('onboarding', 'signup_heading',  'Ready to Start Your Journey?',                                                    'Signup mode heading'),
  ('onboarding', 'signup_subtitle', 'Create your free account and unlock premium investment opportunities.',            'Signup mode subtitle'),
  ('onboarding', 'signup_cta',      'Sign Up Now',                                                                     'Signup mode CTA')
ON CONFLICT (page, section_tag) DO NOTHING;


-- ── CMS Seed: Persona Selection Page ────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('persona', 'title',             'Choose Your Persona',                                                              'Page title'),
  ('persona', 'subtitle',          'Select how you want to use WealthSpot. You can always add more later.',            'Page subtitle'),
  ('persona', 'investor_title',    'Investor',                                                                         'Investor card title'),
  ('persona', 'investor_desc',     'Invest in premium real estate opportunities with fractional ownership.',            'Investor card description'),
  ('persona', 'builder_title',     'Builder',                                                                          'Builder card title'),
  ('persona', 'builder_desc',      'List properties, manage projects, and connect with investors.',                     'Builder card description'),
  ('persona', 'builder_notice',    'Note: Builder access requires verification. You''ll be able to explore the builder dashboard immediately, but creating opportunities will be enabled after admin approval.', 'Builder verification notice')
ON CONFLICT (page, section_tag) DO NOTHING;
