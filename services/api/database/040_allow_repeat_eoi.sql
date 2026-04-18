-- Allow the same investor to submit multiple EOIs for the same property
-- (enables repeat investments after a deal is completed).
ALTER TABLE expressions_of_interest
    DROP CONSTRAINT IF EXISTS uq_eoi_user_opportunity;
