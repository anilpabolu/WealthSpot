"""CHECK constraints on financial columns

Revision ID: 015_checks
Revises: 014_indexes
Create Date: 2025-08-01

"""
from typing import Sequence, Union
from alembic import op

revision: str = "015_checks"
down_revision: Union[str, None] = "014_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Explicit python-based ALTER TABLE checks instead of reading external SQL string overlays
    op.execute("ALTER TABLE transactions ADD CONSTRAINT chk_transactions_amount_positive CHECK (amount >= 0)")
    op.execute("ALTER TABLE loans ADD CONSTRAINT chk_loans_principal_positive CHECK (principal_amount >= 0)")
    op.execute("ALTER TABLE loans ADD CONSTRAINT chk_loans_interest_rate_positive CHECK (interest_rate >= 0)")
    op.execute("ALTER TABLE loans ADD CONSTRAINT chk_loans_tenure_positive CHECK (tenure_months >= 0)")
    # Additional critical protection for Vault opportunities constraint enforcing non-negative targets
    op.execute("ALTER TABLE opportunities ADD CONSTRAINT chk_opportunities_target_amount CHECK (target_amount >= 0)")

def downgrade() -> None:
    op.execute("ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS chk_opportunities_target_amount")
    op.execute("ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transactions_amount_positive")
    op.execute("ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loans_principal_positive")
    op.execute("ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loans_interest_rate_positive")
    op.execute("ALTER TABLE loans DROP CONSTRAINT IF EXISTS chk_loans_tenure_positive")
