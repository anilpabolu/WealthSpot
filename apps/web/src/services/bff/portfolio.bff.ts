/**
 * Portfolio BFF – Investor portfolio aggregation
 */

import { apiGet } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

export interface PortfolioPropertyHolding {
  property_id: string;
  slug: string;
  title: string;
  city: string;
  cover_image: string | null;
  asset_type: string;
  units_held: number;
  invested_amount: number;
  current_value: number;
  unrealized_gain: number;
  monthly_rental: number;
  status: string;
}

export interface PortfolioView {
  summary: {
    total_invested: number;
    current_value: number;
    total_returns: number;
    monthly_rental_income: number;
    properties_count: number;
    unrealized_gain: number;
    xirr: number | null;
  };
  holdings: PortfolioPropertyHolding[];
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    property_title: string;
    created_at: string;
  }>;
}

// ── BFF Service ───────────────────────────────────────────────────────────

export const portfolioBff = {
  /**
   * Full portfolio view: summary + per-property holdings + transaction history.
   */
  async getPortfolio(): Promise<PortfolioView> {
    const [summary, holdings, transactions] = await Promise.all([
      apiGet<PortfolioView["summary"]>("/investments/portfolio/summary"),
      apiGet<PortfolioView["holdings"]>("/investments/portfolio/holdings"),
      apiGet<PortfolioView["transactions"]>("/investments/transactions", {
        params: { limit: 20, sort: "-created_at" },
      }),
    ]);

    return { summary, holdings, transactions };
  },

  /**
   * Single property investment detail within portfolio.
   */
  async getPropertyInvestmentDetail(propertyId: string) {
    const [holding, transactions] = await Promise.all([
      apiGet<PortfolioPropertyHolding>(`/investments/portfolio/holdings/${propertyId}`),
      apiGet<PortfolioView["transactions"]>("/investments/transactions", {
        params: { property_id: propertyId, limit: 50 },
      }),
    ]);

    return { holding, transactions };
  },
};
