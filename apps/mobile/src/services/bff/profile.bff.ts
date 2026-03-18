/**
 * Mobile Profile BFF – user profile, settings, KYC status
 */

import { apiGet, apiPost } from "../../lib/api";

export interface MobileProfileView {
  user: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    avatar_url: string | null;
    role: string;
    kyc_status: string;
    referral_code: string | null;
    wealth_pass_active: boolean;
  };
  stats: {
    investments_count: number;
    total_invested: number;
    referrals_count: number;
  };
}

export const mobileProfileBff = {
  async getProfile(): Promise<MobileProfileView> {
    const [user, portfolioSummary, referrals] = await Promise.all([
      apiGet<MobileProfileView["user"]>("/users/me"),
      apiGet<{ properties_count: number; total_invested: number }>(
        "/investments/portfolio/summary"
      ),
      apiGet<{ total: number }>("/referrals/stats"),
    ]);

    return {
      user,
      stats: {
        investments_count: portfolioSummary.properties_count,
        total_invested: portfolioSummary.total_invested,
        referrals_count: referrals.total,
      },
    };
  },

  async updateProfile(data: { full_name?: string; phone?: string }) {
    return apiPost<{ success: boolean }>("/users/me", data);
  },
};
