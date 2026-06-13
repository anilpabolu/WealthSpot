"""rewrite the Calculating Intrinsic Value tile body as structured Markdown

The Knowledge Hub popup now renders the article body as Markdown, so this
migration replaces the plain-text seed body (from 076) with a richly sectioned
Markdown version (headings, tables, callouts, lists). Idempotent UPDATE by slug.

Revision ID: 077_intrinsic_value_md
Revises: 076_seed_intrinsic_value
Create Date: 2026-06-13

"""

from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

revision: str = "077_intrinsic_value_md"
down_revision: Union[str, None] = "076_seed_intrinsic_value"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SLUG = "calculating-intrinsic-value"

BODY_MD = """## What is intrinsic value?

**Intrinsic value is an estimate of what an asset is truly worth based on its fundamentals, not today's market mood.** It looks at what the asset can generate over its life — cash flows, growth, risk and quality — and asks: *"If I owned the whole thing, what should I logically pay for it?"*

| Concept | What drives it |
| --- | --- |
| **Intrinsic value** | Fundamentals: cash flows, assets, growth, risk, quality of the business or property. *Long-term, rational.* |
| **Market price** | Supply–demand, sentiment, narratives, liquidity, fear and greed in the marketplace. *Short-term, emotional.* |

## How intrinsic value is calculated

Professionals estimate intrinsic value using valuation models that convert **future economic benefits into today's rupees**. The core idea is a discounted cash flow (DCF): intrinsic value ≈ the sum of each future cash flow ÷ (1 + r) raised to the power *t*, where *r* is the required return that reflects risk.

**A practical workflow:**

1. Understand the asset — business, property or project.
2. Estimate realistic future cash flows (rents, profits, free cash flows).
3. Choose a sensible discount rate that reflects risk.
4. Discount those cash flows back to today and sum them up.
5. Adjust for balance-sheet items (debt, cash, one-offs).
6. Compare your intrinsic value with the current market price.

## Analogy 1 — The coffee can: what's inside vs what you pay

A takeaway coffee has a simple, low intrinsic value, but the market price is much higher because of add-ons and branding.

| Intrinsic value (core) | Amount |
| --- | --- |
| Coffee | ₹30 |
| Milk | ₹20 |
| **Total intrinsic value** | **₹50** |

| Added value (all extras) | Amount |
| --- | --- |
| Foam | ₹50 |
| Container | ₹80 |
| Cap | ₹25 |
| Sugar | ₹15 |
| Brand | ₹80 |
| Marketing | ₹70 |
| **Total added value** | **₹320** |
| **Market price** | **₹370** |

> Focus on what's **INSIDE**. That's where the real value is.

## Analogy 2 — Real estate: structure vs story

A modern villa's intrinsic value is driven by land and construction. The final selling price includes heavy add-ons.

| Intrinsic value (core) | Amount |
| --- | --- |
| Land value | ₹20,00,000 |
| Construction value | ₹30,00,000 |
| **Total intrinsic value** | **₹50,00,000** *(≈ half of market value)* |

| Added value (all included) | Amount |
| --- | --- |
| Brand / developer | ₹20,00,000 |
| Marketing & advertising | ₹20,00,000 |
| Glossy presentation | ₹5,00,000 |
| Operations cost | ₹5,00,000 |
| Credits, loans | ₹35,00,000 |
| **Total added value** | **₹85,00,000** |
| **Market price** | **₹1,35,00,000** *(typically 2–3× intrinsic value)* |

> Don't get blinded by what's added. Look at the **REAL VALUE**.

## From concept to action

The edge lies in behaving like a rational appraiser, not a distracted bidder. Use intrinsic value as your anchor, then negotiate around it.

**Smart investor checklist:**

- Be a smart buyer.
- Look deeper than the brochure.
- Buy near or below intrinsic value.
- Build real, compounding wealth.

---

**The WealthSpot lens** — WealthSpot is built to help you separate core value from noise, highlighting assets where fundamentals justify the price you pay. *Magnify the signal, not the hype. Intrinsic value today, real wealth tomorrow.*"""


def upgrade() -> None:
    op.get_bind().execute(
        sa.text("UPDATE knowledge_articles SET body = :body WHERE slug = :slug"),
        {"body": BODY_MD, "slug": SLUG},
    )


def downgrade() -> None:
    # No-op: the previous plain-text body is preserved in migration 076's history.
    pass
