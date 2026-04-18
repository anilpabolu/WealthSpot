-- 039_metrics_seed_data.sql
-- Seed realistic min_investment, city, and industry data on existing opportunities
-- so vault metrics (min_investment, cities_covered, sectors_covered) display live data.

BEGIN;

-- Populate min_investment where NULL (wealth vault properties)
UPDATE opportunities
SET min_investment = CASE
    WHEN vault_type = 'wealth' THEN
        CASE (random() * 4)::int
            WHEN 0 THEN 10000
            WHEN 1 THEN 25000
            WHEN 2 THEN 50000
            WHEN 3 THEN 100000
            ELSE 15000
        END
    WHEN vault_type = 'opportunity' THEN
        CASE (random() * 3)::int
            WHEN 0 THEN 50000
            WHEN 1 THEN 100000
            WHEN 2 THEN 250000
            ELSE 75000
        END
    WHEN vault_type = 'community' THEN
        CASE (random() * 3)::int
            WHEN 0 THEN 5000
            WHEN 1 THEN 10000
            WHEN 2 THEN 25000
            ELSE 10000
        END
    ELSE 10000
END
WHERE min_investment IS NULL;

-- Populate city where NULL
UPDATE opportunities
SET city = CASE (random() * 9)::int
    WHEN 0 THEN 'Mumbai'
    WHEN 1 THEN 'Bangalore'
    WHEN 2 THEN 'Hyderabad'
    WHEN 3 THEN 'Pune'
    WHEN 4 THEN 'Chennai'
    WHEN 5 THEN 'Delhi'
    WHEN 6 THEN 'Gurugram'
    WHEN 7 THEN 'Noida'
    WHEN 8 THEN 'Ahmedabad'
    ELSE 'Kolkata'
END
WHERE city IS NULL;

-- Populate industry where NULL (opportunity vault startups)
UPDATE opportunities
SET industry = CASE (random() * 7)::int
    WHEN 0 THEN 'FinTech'
    WHEN 1 THEN 'HealthTech'
    WHEN 2 THEN 'EdTech'
    WHEN 3 THEN 'SaaS'
    WHEN 4 THEN 'CleanTech'
    WHEN 5 THEN 'AgriTech'
    WHEN 6 THEN 'PropTech'
    ELSE 'DeepTech'
END
WHERE industry IS NULL AND vault_type = 'opportunity';

-- Populate industry for wealth vault (real estate sectors)
UPDATE opportunities
SET industry = CASE (random() * 4)::int
    WHEN 0 THEN 'Residential'
    WHEN 1 THEN 'Commercial'
    WHEN 2 THEN 'Warehousing'
    WHEN 3 THEN 'Plotted Development'
    ELSE 'Mixed Use'
END
WHERE industry IS NULL AND vault_type = 'wealth';

-- Populate industry for community vault
UPDATE opportunities
SET industry = CASE (random() * 4)::int
    WHEN 0 THEN 'Real Estate'
    WHEN 1 THEN 'Infrastructure'
    WHEN 2 THEN 'Renewable Energy'
    WHEN 3 THEN 'Hospitality'
    ELSE 'Mixed Use'
END
WHERE industry IS NULL AND vault_type = 'community';

-- Populate community_subtype where NULL for community vault
UPDATE opportunities
SET community_subtype = CASE
    WHEN random() < 0.5 THEN 'co_investor'
    ELSE 'co_partner'
END
WHERE vault_type = 'community' AND community_subtype IS NULL;

COMMIT;
