-- 015: Add missing CHECK constraints on transactions and loans tables
-- Prevents invalid data (negative amounts, zero principal, etc.)

ALTER TABLE transactions
  ADD CONSTRAINT chk_transactions_amount_positive CHECK (amount > 0);

ALTER TABLE loans
  ADD CONSTRAINT chk_loans_principal_positive CHECK (principal > 0),
  ADD CONSTRAINT chk_loans_interest_rate_positive CHECK (interest_rate > 0),
  ADD CONSTRAINT chk_loans_tenure_positive CHECK (tenure_months > 0);
