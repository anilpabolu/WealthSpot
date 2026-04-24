/**
 * Mobile Dashboard BFF – matches web's dashboard.bff.ts patterns.
 */

import { apiGet } from "../../lib/api";

export interface DashboardView {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: string;
    kycStatus: string;
    wealthPassActive: boolean;
  };
  portfolio: {
    totalInvested: number;
    currentValue: number;
    totalReturns: number;
    monthlyRentalIncome: number;
    propertiesCount: number;
  };
  recentTransactions: {
    id: string;
    type: string;
    amount: number;
    description: string | null;
    createdAt: string;
  }[];
  activeProperties: {
    id: string;
    slug: string;
    title: string;
    coverImage: string | null;
    city: string;
    targetIrr: number;
    fundingPercentage: number;
    status: string;
  }[];
  greeting: string;
}

export const mobileDashboardBff = {
  async getDashboard(): Promise<DashboardView> {
    const [user, portfolio, transactions, properties] = await Promise.all([
      apiGet<DashboardView["user"]>("/auth/me"),
      apiGet<DashboardView["portfolio"]>("/investments/portfolio/summary"),
      apiGet<DashboardView["recentTransactions"]>("/investments/transactions", {
        params: { limit: 5, sort: "-created_at" },
      }),
      apiGet<DashboardView["activeProperties"]>("/properties", {
        params: { status: "funding", page_size: 3, sort: "-launch_date" },
      }),
    ]);

    const hour = new Date().getHours();
    const timeOfDay =
      hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";
    const firstName = (user.fullName ?? "").split(" ")[0] || "there";

    return {
      user,
      portfolio,
      recentTransactions: transactions,
      activeProperties: properties,
      greeting: `Good ${timeOfDay}, ${firstName}!`,
    };
  },
};
