"""remove cash_flows and parcel_dimensions from shield

Revision ID: 43619bfcc037
Revises: 070_opportunity_extra_fields
Create Date: 2026-06-04 15:50:52.548819

"""

from collections.abc import Sequence
from typing import Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "43619bfcc037"
down_revision: Union[str, None] = "070_opportunity_extra_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove deprecated shield assessment fields
    op.execute(
        """
        DELETE FROM opportunity_assessments
        WHERE subcategory_code IN ('cash_flows', 'parcel_dimensions')
        """
    )


def downgrade() -> None:
    pass
