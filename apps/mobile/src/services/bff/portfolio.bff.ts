/**
 * Mobile Portfolio BFF
 */

import { apiGet } from "../../lib/api";

export interface MobilePortfolioView {
  total_invested: number;
  current_value: number;
  monthly_income: number;
  holdings: Array<{
    property_id: string;
    title: string;
    city: string;
    cover_image: string | null;
    units_held: number;
    current_value: number;
    monthly_rental: number;
  }>;
}

export const mobilePortfolioBff = {
  async getPortfolio(): Promise<MobilePortfolioView> {
    const [summary, holdings] = await Promise.all([
      apiGet<{
        total_invested: number;
        current_value: number;
        monthly_rental_income: number;
      }>("/investments/portfolio/summary"),
      apiGet<MobilePortfolioView["holdings"]>("/investments/portfolio/holdings"),
    ]);

    return {
      total_invested: summary.total_invested,
      current_value: summary.current_value,
      monthly_income: summary.monthly_rental_income,
      holdings,
    };
  },
};
