/**
 * Mobile Portfolio BFF – matches web's portfolio.bff.ts patterns.
 */

import { apiGet } from "../../lib/api";

export interface PortfolioPropertyHolding {
  propertyId: string;
  slug: string;
  title: string;
  city: string;
  coverImage: string | null;
  assetType: string;
  unitsHeld: number;
  investedAmount: number;
  currentValue: number;
  unrealizedGain: number;
  monthlyRental: number;
  status: string;
}

export interface PortfolioView {
  summary: {
    totalInvested: number;
    currentValue: number;
    totalReturns: number;
    monthlyRentalIncome: number;
    propertiesCount: number;
    unrealizedGain: number;
    xirr: number | null;
  };
  holdings: PortfolioPropertyHolding[];
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string | null;
    propertyTitle: string;
    createdAt: string;
  }>;
}

export const mobilePortfolioBff = {
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

  async getPropertyInvestmentDetail(propertyId: string) {
    const [holding, transactions] = await Promise.all([
      apiGet<PortfolioPropertyHolding>(
        `/investments/portfolio/holdings/${propertyId}`
      ),
      apiGet<PortfolioView["transactions"]>("/investments/transactions", {
        params: { property_id: propertyId, limit: 50 },
      }),
    ]);
    return { holding, transactions };
  },
};
