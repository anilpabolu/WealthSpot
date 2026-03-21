/**
 * Mobile Profile BFF – user profile, settings, KYC status
 */

import { apiGet, apiPut } from "../../lib/api";

export interface ProfileView {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    kycStatus: string;
    referralCode: string | null;
    wealthPassActive: boolean;
    createdAt: string;
  };
  stats: {
    investmentsCount: number;
    totalInvested: number;
    referralsCount: number;
  };
}

export const mobileProfileBff = {
  async getProfile(): Promise<ProfileView> {
    const [user, portfolioSummary, referrals] = await Promise.all([
      apiGet<ProfileView["user"]>("/auth/me"),
      apiGet<{ propertiesCount: number; totalInvested: number }>(
        "/investments/portfolio/summary"
      ),
      apiGet<{ totalReferrals: number }>("/referrals/stats"),
    ]);

    return {
      user,
      stats: {
        investmentsCount: portfolioSummary.propertiesCount,
        totalInvested: portfolioSummary.totalInvested,
        referralsCount: referrals.totalReferrals,
      },
    };
  },

  async updateProfile(data: { fullName?: string; phone?: string }) {
    return apiPut<{ success: boolean }>("/auth/me", {
      full_name: data.fullName,
      phone: data.phone,
    });
  },
};
