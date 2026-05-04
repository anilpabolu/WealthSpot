/**
 * Dashboard BFF – Investor / Builder / Lender dashboard view
 *
 * Aggregates user profile, portfolio summary, recent transactions,
 * and active properties into a single view-ready payload.
 */

import type {
  DashboardView,
  BuilderDashboardView,
} from "@wealthspot/types";
import { apiGet } from "../../lib/api";

// Re-export for consumers that import from this module directly
export type { DashboardView, BuilderDashboardView };

// ── BFF Service ───────────────────────────────────────────────────────────

export const dashboardBff = {
  /**
   * Fetch everything the investor dashboard page needs in parallel.
   */
  async getInvestorDashboard(): Promise<DashboardView> {
    const [user, portfolio, transactions, properties] = await Promise.all([
      apiGet<DashboardView["user"]>("/users/me"),
      apiGet<DashboardView["portfolio"]>("/investments/portfolio/summary"),
      apiGet<DashboardView["recentTransactions"]>("/investments/transactions", {
        params: { limit: 5, sort: "-created_at" },
      }),
      apiGet<DashboardView["activeProperties"]>("/properties", {
        params: { status: "funding", page_size: 4, sort: "-launch_date" },
      }),
    ]);

    return { user, portfolio, recentTransactions: transactions, activeProperties: properties };
  },

  /**
   * Builder dashboard: properties + stats.
   */
  async getBuilderDashboard(): Promise<BuilderDashboardView> {
    // API client converts snake_case → camelCase so we access camelCase fields
    const profile = await apiGet<{
      companyName: string;
      verified: boolean;
      properties: Array<{
        id: string;
        title: string;
        status: string;
        raisedAmount: number;
        targetAmount: number;
        investorCount: number;
        city?: string;
      }>;
    }>("/properties/builders/me");

    const listings = profile.properties ?? [];
    const stats = {
      totalRaised: listings.reduce((sum, p) => sum + (p.raisedAmount ?? 0), 0),
      activeCount: listings.filter((p) => p.status === "funding" || p.status === "active").length,
      investorCount: listings.reduce((sum, p) => sum + (p.investorCount ?? 0), 0),
    };

    return {
      builder: { companyName: profile.companyName, verified: profile.verified },
      listings,
      stats,
    };
  },
};
