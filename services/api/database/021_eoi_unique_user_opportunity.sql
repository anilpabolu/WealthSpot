-- Migration 021: Deduplicate EOIs and add unique constraint (user_id, opportunity_id).
-- Keeps the earliest EOI per user+opportunity pair, removes later duplicates.

-- Step 1: Remove duplicate rows, keeping the one with the earliest created_at
DELETE FROM eoi_question_answers
WHERE eoi_id IN (
    SELECT id FROM expressions_of_interest
    WHERE id NOT IN (
        SELECT DISTINCT ON (user_id, opportunity_id) id
        FROM expressions_of_interest
        ORDER BY user_id, opportunity_id, created_at ASC
    )
);

DELETE FROM expressions_of_interest
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, opportunity_id) id
    FROM expressions_of_interest
    ORDER BY user_id, opportunity_id, created_at ASC
);

-- Step 2: Add unique constraint
ALTER TABLE expressions_of_interest
    ADD CONSTRAINT uq_eoi_user_opportunity UNIQUE (user_id, opportunity_id);
