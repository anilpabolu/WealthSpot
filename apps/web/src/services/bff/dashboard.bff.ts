/**
 * Dashboard BFF – Investor / Builder / Lender dashboard view
 *
 * Aggregates user profile, portfolio summary, recent transactions,
 * and active properties into a single view-ready payload.
 */

import { apiGet } from "../../lib/api";

// ── Types (view-specific, not raw API shapes) ─────────────────────────────

export interface DashboardView {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    kyc_status: string;
    wealth_pass_active: boolean;
  };
  portfolio: {
    total_invested: number;
    current_value: number;
    total_returns: number;
    monthly_rental_income: number;
    properties_count: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    created_at: string;
  }>;
  activeProperties: Array<{
    id: string;
    slug: string;
    title: string;
    cover_image: string | null;
    city: string;
    target_irr: number;
    funding_percentage: number;
    status: string;
  }>;
}

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
  async getBuilderDashboard(): Promise<{
    builder: { company_name: string; verified: boolean };
    listings: Array<{
      id: string;
      title: string;
      status: string;
      raised_amount: number;
      target_amount: number;
      investor_count: number;
      city?: string;
    }>;
    stats: { total_raised: number; active_count: number; investor_count: number };
  }> {
    const profile = await apiGet<{
      company_name: string;
      verified: boolean;
      properties: Array<{
        id: string;
        title: string;
        status: string;
        raised_amount: number;
        target_amount: number;
        investor_count: number;
        city?: string;
      }>;
    }>("/properties/builders/me");

    const listings = profile.properties ?? [];
    const stats = {
      total_raised: listings.reduce((sum, p) => sum + (p.raised_amount ?? 0), 0),
      active_count: listings.filter((p) => p.status === "funding" || p.status === "active").length,
      investor_count: listings.reduce((sum, p) => sum + (p.investor_count ?? 0), 0),
    };

    return {
      builder: { company_name: profile.company_name, verified: profile.verified },
      listings,
      stats,
    };
  },
};
