/**
 * Portfolio BFF – Investor portfolio aggregation
 */

import type {
  PortfolioView,
  PortfolioPropertyHolding,
} from "@wealthspot/types";
import { apiGet } from "../../lib/api";

// Re-export for consumers that import from this module directly
export type { PortfolioView, PortfolioPropertyHolding };
// ── BFF Service ───────────────────────────────────────────────────────────

export const portfolioBff = {
  /**
   * Full portfolio view: summary + per-property holdings + transaction history.
   */
  async getPortfolio(): Promise<PortfolioView> {
    const [summary, holdings, transactions] = await Promise.all([
      apiGet<PortfolioView["summary"]>("/portfolio/summary"),
      apiGet<PortfolioView["holdings"]>("/portfolio/properties"),
      apiGet<PortfolioView["transactions"]>("/portfolio/transactions", {
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
      apiGet<PortfolioPropertyHolding>(`/portfolio/properties/${propertyId}`),
      apiGet<PortfolioView["transactions"]>("/investments/transactions", {
        params: { property_id: propertyId, limit: 50 },
      }),
    ]);

    return { holding, transactions };
  },
};
