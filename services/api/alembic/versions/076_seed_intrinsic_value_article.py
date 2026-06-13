"""seed the Calculating Intrinsic Value knowledge tile

Inserts the existing "Calculating Intrinsic Value" white paper as the first
Knowledge Hub tile so the Hub is populated out of the box. Idempotent
(ON CONFLICT on the stable slug) and owned by the earliest existing user; if the
database has no users yet (fresh bootstrap) the seed is skipped.

Revision ID: 076_seed_intrinsic_value
Revises: 075_add_knowledge_hub
Create Date: 2026-06-13

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "076_seed_intrinsic_value"
down_revision: Union[str, None] = "075_add_knowledge_hub"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SLUG = "calculating-intrinsic-value"
TITLE = "Calculating Intrinsic Value"
SYNOPSIS = (
    "A practical mental model using coffee and real estate to understand intrinsic value "
    "vs market price - and why smart investors pay for what actually adds value."
)
COVER = "/assets/images/intrinsic-value-poster.png"
BODY = """Intrinsic value is an estimate of what an asset is truly worth based on its fundamentals, not today's market mood. It looks at what the asset can generate over its life - cash flows, growth, risk, and quality - and asks: "If I owned the whole thing, what should I logically pay for it?"

Intrinsic value vs market price. Intrinsic value is driven by fundamentals: cash flows, assets, growth, risk, and the quality of the business or property. It is long-term and rational. Market price is driven by supply and demand, sentiment, narratives, liquidity, fear and greed in the marketplace. It is short-term and emotional.

How intrinsic value is calculated. Professionals estimate intrinsic value using valuation models that convert future economic benefits into today's rupees. The core idea is a discounted cash flow (DCF): intrinsic value is approximately the sum of each future cash flow divided by (1 + r) raised to the power t, where r is the required return that reflects risk.

A practical workflow: (1) Understand the asset - business, property, or project. (2) Estimate realistic future cash flows such as rents, profits and free cash flows. (3) Choose a sensible discount rate that reflects risk. (4) Discount those cash flows back to today and sum them up. (5) Adjust for balance-sheet items such as debt, cash and one-offs. (6) Compare your intrinsic value with the current market price.

Analogy 1 - The coffee can: what's inside vs what you pay. A takeaway coffee has a simple, low intrinsic value, but the market price is much higher because of add-ons and branding. The intrinsic core is small - coffee (Rs 30) plus milk (Rs 20) = Rs 50. The added value is everything else - foam, container, cap, sugar, brand and marketing - around Rs 320, pushing the market price to about Rs 370. Focus on what is INSIDE. That is where the real value is.

Analogy 2 - Real estate: structure vs story. A modern villa's intrinsic value is driven by land and construction. Land value (Rs 20,00,000) plus construction value (Rs 30,00,000) gives an intrinsic value of about Rs 50,00,000 - roughly half of the market value. Added value - brand and developer, marketing and advertising, glossy presentation, operations cost, and credits and loans - can add about Rs 85,00,000, taking the market price to roughly Rs 1,35,00,000. The final price is typically 2-3x the intrinsic value. Do not get blinded by what is added. Look at the REAL VALUE.

From concept to action. The edge lies in behaving like a rational appraiser, not a distracted bidder. Use intrinsic value as your anchor, then negotiate around it. The smart investor checklist: be a smart buyer; look deeper than the brochure; buy near or below intrinsic value; and build real, compounding wealth.

The WealthSpot lens. WealthSpot is built to help you separate core value from noise - highlighting assets where fundamentals justify the price you pay. Magnify the signal, not the hype. Intrinsic value today, real wealth tomorrow."""


def upgrade() -> None:
    conn = op.get_bind()
    admin_id = conn.execute(sa.text("SELECT id FROM users ORDER BY created_at LIMIT 1")).scalar()
    if admin_id is None:
        return  # no users yet — skip seed (bootstrap DB)
    conn.execute(
        sa.text(
            """
            INSERT INTO knowledge_articles
                (slug, title, synopsis, body, cover_image_url, is_published, sort_order, created_by)
            VALUES
                (:slug, :title, :synopsis, :body, :cover, TRUE, 0, :created_by)
            ON CONFLICT (slug) DO NOTHING
            """
        ),
        {
            "slug": SLUG,
            "title": TITLE,
            "synopsis": SYNOPSIS,
            "body": BODY,
            "cover": COVER,
            "created_by": admin_id,
        },
    )


def downgrade() -> None:
    op.execute(f"DELETE FROM knowledge_articles WHERE slug = '{SLUG}';")
