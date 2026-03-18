-- ============================================================================
-- WealthSpot – Seed Data for Development
-- Run AFTER 001_initial_schema.sql
-- ============================================================================

-- ---------------------------------------------------------------------------
-- USERS (6 users: 2 investors, 1 builder, 1 lender, 1 admin, 1 referred)
-- ---------------------------------------------------------------------------

INSERT INTO users (id, clerk_id, email, full_name, phone, role, kyc_status, pan_number, referral_code, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'clerk_dev_admin', 'admin@wealthspot.in', 'Priya Sharma', '+919876543210', 'admin', 'APPROVED', 'ABCDE1234F', 'ADMIN001', TRUE),
  ('a0000000-0000-0000-0000-000000000002', 'clerk_dev_builder', 'builder@wealthspot.in', 'Rajesh Constructions', '+919876543211', 'builder', 'APPROVED', 'FGHIJ5678K', 'BUILD001', TRUE),
  ('a0000000-0000-0000-0000-000000000003', 'clerk_dev_investor1', 'investor1@wealthspot.in', 'Anita Verma', '+919876543212', 'investor', 'APPROVED', 'KLMNO9012L', 'INVEST01', TRUE),
  ('a0000000-0000-0000-0000-000000000004', 'clerk_dev_investor2', 'investor2@wealthspot.in', 'Vikram Singh', '+919876543213', 'investor', 'IN_PROGRESS', 'PQRST3456M', 'INVEST02', TRUE),
  ('a0000000-0000-0000-0000-000000000005', 'clerk_dev_lender', 'lender@wealthspot.in', 'Meena Capital LLC', '+919876543214', 'lender', 'APPROVED', 'UVWXY7890N', 'LEND0001', TRUE),
  ('a0000000-0000-0000-0000-000000000006', 'clerk_dev_referred', 'referred@wealthspot.in', 'Karan Patel', '+919876543215', 'investor', 'NOT_STARTED', NULL, 'REFER001', TRUE);

-- Set user #6 as referred by investor1
UPDATE users SET referred_by = 'a0000000-0000-0000-0000-000000000003' WHERE id = 'a0000000-0000-0000-0000-000000000006';

-- ---------------------------------------------------------------------------
-- BUILDER PROFILE
-- ---------------------------------------------------------------------------

INSERT INTO builders (id, user_id, company_name, rera_number, cin, gstin, website, description, verified) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
   'Rajesh Constructions Pvt Ltd', 'RERA-MH-2024-00123', 'U45400MH2024PTC123456', '27AABCR1234A1Z5',
   'https://rajeshconstructions.example.com',
   'Premium real estate developer operating across Mumbai, Pune, and Bangalore with 15+ years of experience.',
   TRUE);

-- ---------------------------------------------------------------------------
-- PROPERTIES (4 properties in various statuses)
-- ---------------------------------------------------------------------------

INSERT INTO properties (id, builder_id, slug, title, tagline, description, asset_type, status, city, state, locality, address, latitude, longitude, target_amount, raised_amount, min_investment, unit_price, total_units, sold_units, target_irr, rental_yield, area_sqft, bedrooms, possession_date, rera_id, cover_image, amenities, investor_count, launch_date) VALUES

  -- Active – funding
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
   'azure-heights-bandra', 'Azure Heights', 'Premium living in the heart of Bandra',
   'Azure Heights is a state-of-the-art residential tower offering 2 & 3 BHK apartments with premium amenities, sea-facing views, and world-class infrastructure. Located in Bandra West, one of Mumbai''s most sought-after neighborhoods.',
   'Residential', 'funding',
   'Mumbai', 'Maharashtra', 'Bandra West', '14th Road, Bandra West, Mumbai 400050',
   19.0596, 72.8295,
   50000000.00, 32500000.00, 25000.00, 50000.00, 1000, 650,
   14.50, 3.80, 1250, 2, '2026-12', 'RERA-MH-2024-00456',
   'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00',
   ARRAY['Swimming Pool', 'Gymnasium', 'Clubhouse', 'Garden', 'Parking', '24x7 Security'],
   42, NOW() - INTERVAL '30 days'),

  -- Active – funding, commercial
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
   'tech-park-whitefield', 'NexGen Tech Park', 'Grade-A office space in IT corridor',
   'NexGen Tech Park offers Grade-A commercial office spaces in Whitefield, Bangalore. Pre-leased to marquee IT tenants with long-term lease agreements ensuring stable rental income.',
   'Commercial', 'funding',
   'Bangalore', 'Karnataka', 'Whitefield', 'ITPL Main Road, Whitefield, Bangalore 560066',
   12.9716, 77.7500,
   80000000.00, 20000000.00, 50000.00, 100000.00, 800, 200,
   16.20, 5.10, 45000, NULL, '2025-06', 'RERA-KA-2024-00789',
   'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab',
   ARRAY['Central AC', 'Server Room', 'Cafeteria', 'EV Charging', 'Fire Safety', 'Power Backup'],
   18, NOW() - INTERVAL '15 days'),

  -- Draft
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
   'marina-bay-ecr', 'Marina Bay', 'Beachfront plotted development on ECR',
   'Marina Bay is an exclusive plotted development on East Coast Road, Chennai. Each plot comes with ocean views, private beach access, and gated community infrastructure.',
   'Plotted Development', 'draft',
   'Chennai', 'Tamil Nadu', 'ECR', 'East Coast Road, Kovalam, Chennai 603112',
   12.7900, 80.2500,
   30000000.00, 0, 10000.00, 10000.00, 3000, 0,
   12.00, NULL, NULL, NULL, '2027-03', NULL,
   'https://images.unsplash.com/photo-1519125323398-675f0ddb6308',
   ARRAY['Beach Access', 'Landscaping', 'Gated Community', 'Underground Cabling'],
   0, NULL),

  -- Funded (completed)
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001',
   'sunnyvale-warehousing-pune', 'Sunnyvale Warehousing Hub', 'Grade-A warehousing at Chakan MIDC',
   'Sunnyvale Warehousing Hub is a premium logistics facility at Chakan MIDC, Pune. Leased to a Fortune 500 logistics company on a 10-year agreement.',
   'Warehousing', 'funded',
   'Pune', 'Maharashtra', 'Chakan MIDC', 'Plot No. 45, Chakan MIDC, Pune 410501',
   18.7609, 73.8590,
   25000000.00, 25000000.00, 25000.00, 25000.00, 1000, 1000,
   13.80, 7.20, 100000, NULL, '2025-01', 'RERA-MH-2024-01234',
   'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d',
   ARRAY['Loading Docks', 'Fire Suppression', '24x7 Security', 'CCTV', 'Wide Roads'],
   68, NOW() - INTERVAL '90 days');

-- ---------------------------------------------------------------------------
-- INVESTMENTS (4 investments for the 2 investors)
-- ---------------------------------------------------------------------------

INSERT INTO investments (id, user_id, property_id, units, amount, unit_price, status, razorpay_order_id, razorpay_payment_id) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000001', 10, 500000.00, 50000.00, 'confirmed',
   'order_dev_001', 'pay_dev_001'),

  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000004', 20, 500000.00, 25000.00, 'confirmed',
   'order_dev_002', 'pay_dev_002'),

  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004',
   'c0000000-0000-0000-0000-000000000001', 5, 250000.00, 50000.00, 'payment_pending',
   'order_dev_003', NULL),

  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005',
   'c0000000-0000-0000-0000-000000000002', 30, 3000000.00, 100000.00, 'confirmed',
   'order_dev_004', 'pay_dev_004');

-- ---------------------------------------------------------------------------
-- TRANSACTIONS
-- ---------------------------------------------------------------------------

INSERT INTO transactions (id, investment_id, user_id, type, amount, description, reference_id) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',
   'investment', 500000.00, 'Investment in Azure Heights – 10 units', 'pay_dev_001'),

  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003',
   'investment', 500000.00, 'Investment in Sunnyvale Warehousing – 20 units', 'pay_dev_002'),

  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003',
   'rental_payout', 9000.00, 'Monthly rental payout – Sunnyvale Warehousing (Jan 2025)', 'payout_jan_001'),

  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000005',
   'investment', 3000000.00, 'Investment in NexGen Tech Park – 30 units', 'pay_dev_004');

-- ---------------------------------------------------------------------------
-- COMMUNITY POSTS
-- ---------------------------------------------------------------------------

INSERT INTO community_posts (id, user_id, post_type, title, body, category, tags, upvotes, reply_count) VALUES
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',
   'discussion', 'First-time fractional investor – any tips?',
   'I just invested in Azure Heights. Excited but also nervous. Any seasoned investors here who can share their experience with fractional real estate in India?',
   'investing', '["beginner","tips","residential"]', 12, 2),

  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004',
   'question', 'How does KYC verification work?',
   'I uploaded my PAN and Aadhaar but the status still shows IN_PROGRESS. How long does verification typically take?',
   'platform', '["kyc","verification"]', 5, 1),

  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'announcement', 'WealthSpot crosses ₹10 Crore in total investments!',
   'We are thrilled to announce that our platform has facilitated over ₹10 Crore in fractional real estate investments. Thank you to our amazing community of investors and builders!',
   'announcements', '["milestone","platform"]', 45, 0);

-- ---------------------------------------------------------------------------
-- COMMUNITY REPLIES
-- ---------------------------------------------------------------------------

INSERT INTO community_replies (id, post_id, user_id, body, upvotes) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005',
   'Welcome! I''ve been investing in commercial real estate through the platform for a few months now. The rental yields have been consistent. My tip: diversify across property types.', 6),

  ('f1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Great to have you on board, Anita! Feel free to reach out to our support team if you have any questions. We also have a detailed investor guide on our website.', 3),

  ('f1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'Hi Vikram! KYC verification usually takes 24-48 business hours. If it''s been longer, please write to support@wealthspot.in. We process them in the order received.', 4);

-- ---------------------------------------------------------------------------
-- REFERRALS
-- ---------------------------------------------------------------------------

INSERT INTO referrals (id, referrer_id, referee_id, code_used, reward_amount, reward_claimed) VALUES
  ('f2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000006', 'INVEST01', 50000, FALSE);

-- ---------------------------------------------------------------------------
-- LOANS
-- ---------------------------------------------------------------------------

INSERT INTO loans (id, lender_id, property_id, principal, interest_rate, tenure_months, amount_repaid, status, next_payment_date) VALUES
  ('f3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000005',
   'c0000000-0000-0000-0000-000000000002', 500000000, 10.5, 36, 0, 'active', NOW() + INTERVAL '30 days');

-- ---------------------------------------------------------------------------
-- AUDIT LOGS (sample entries)
-- ---------------------------------------------------------------------------

INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, details, ip_address) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'property.approved', 'property', 'c0000000-0000-0000-0000-000000000001',
   '{"previous_status":"under_review","new_status":"funding"}', '203.0.113.10'),
  ('a0000000-0000-0000-0000-000000000003', 'investment.created', 'investment', 'd0000000-0000-0000-0000-000000000001',
   '{"property":"Azure Heights","units":10,"amount":500000}', '198.51.100.22'),
  ('a0000000-0000-0000-0000-000000000002', 'property.created', 'property', 'c0000000-0000-0000-0000-000000000003',
   '{"title":"Marina Bay","asset_type":"Plotted Development"}', '192.0.2.5');

-- ============================================================================
-- DONE – seed data loaded
-- ============================================================================
SELECT 'Seed data loaded:' AS status,
       (SELECT COUNT(*) FROM users) AS users,
       (SELECT COUNT(*) FROM builders) AS builders,
       (SELECT COUNT(*) FROM properties) AS properties,
       (SELECT COUNT(*) FROM investments) AS investments,
       (SELECT COUNT(*) FROM transactions) AS transactions,
       (SELECT COUNT(*) FROM community_posts) AS posts,
       (SELECT COUNT(*) FROM community_replies) AS replies,
       (SELECT COUNT(*) FROM loans) AS loans;
