/**
 * Mobile Dashboard BFF
 */

import { apiGet } from "../../lib/api";

export interface MobileDashboardView {
  greeting: string;
  kyc_status: string;
  portfolio_value: number;
  monthly_income: number;
  properties_count: number;
  featured: Array<{
    id: string;
    slug: string;
    title: string;
    cover_image: string | null;
    city: string;
    target_irr: number;
    funding_percentage: number;
  }>;
}

export const mobileDashboardBff = {
  async getDashboard(): Promise<MobileDashboardView> {
    const [user, portfolio, featured] = await Promise.all([
      apiGet<{ full_name: string; kyc_status: string }>("/users/me"),
      apiGet<{
        current_value: number;
        monthly_rental_income: number;
        properties_count: number;
      }>("/investments/portfolio/summary"),
      apiGet<MobileDashboardView["featured"]>("/properties", {
        status: "funding",
        page_size: 3,
        sort: "-launch_date",
      }),
    ]);

    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening";

    return {
      greeting: `Good ${timeOfDay}, ${user.full_name.split(" ")[0]}!`,
      kyc_status: user.kyc_status,
      portfolio_value: portfolio.current_value,
      monthly_income: portfolio.monthly_rental_income,
      properties_count: portfolio.properties_count,
      featured,
    };
  },
};
