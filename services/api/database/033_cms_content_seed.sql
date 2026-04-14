-- 033: CMS seed data for newly CMS-enabled pages
-- Seeds site_content entries for Settings, KYC, Profile, Investor Portfolio, Builder Listings

-- ── Settings Page ───────────────────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('settings', 'hero_badge',    'Settings',                                                                       'Settings hero badge text'),
  ('settings', 'hero_title',    'Mission Control',                                                                'Settings hero heading'),
  ('settings', 'hero_subtitle', 'Manage your profile, security, and preferences — everything in one place.',      'Settings hero subtitle')
ON CONFLICT (page, section_tag) DO NOTHING;

-- ── KYC Identity Page ───────────────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('kyc', 'hero_badge',    'KYC',                                                     'KYC hero badge text'),
  ('kyc', 'hero_title',    'Identity Verification',                                    'KYC hero heading'),
  ('kyc', 'hero_subtitle', 'Complete KYC to start investing — takes only 5 minutes',   'KYC hero subtitle')
ON CONFLICT (page, section_tag) DO NOTHING;

-- ── Profile Completion Page ─────────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('profile', 'hero_title',    'Complete Your Profile',                                                             'Profile hero heading'),
  ('profile', 'hero_subtitle', 'Unlock premium features, personalized recommendations & your unique referral code', 'Profile hero subtitle')
ON CONFLICT (page, section_tag) DO NOTHING;

-- ── Investor Portfolio Page ─────────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('investor_portfolio', 'page_title',    'My Portfolio',                          'Investor portfolio page title'),
  ('investor_portfolio', 'page_subtitle', 'Track your real estate investments',    'Investor portfolio page subtitle')
ON CONFLICT (page, section_tag) DO NOTHING;

-- ── Builder Listings Page ───────────────────────────────────────────────────
INSERT INTO site_content (page, section_tag, value, description) VALUES
  ('builder_listings', 'page_title',    'My Listings',                                 'Builder listings page title'),
  ('builder_listings', 'page_subtitle', 'Manage and track your property listings',     'Builder listings page subtitle')
ON CONFLICT (page, section_tag) DO NOTHING;
