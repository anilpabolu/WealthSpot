/**
 * Mobile Admin BFF – Admin dashboard, user management, property approvals.
 * Mirrors web's admin.bff.ts.
 */

import { apiGet, apiPost, apiPut } from "../../lib/api";

export interface AdminDashboardView {
  stats: {
    totalUsers: number;
    totalInvestors: number;
    totalBuilders: number;
    totalProperties: number;
    activeProperties: number;
    totalInvested: number;
    totalTransactions: number;
    kycPendingCount: number;
  };
  pendingKyc: Array<{
    userId: string;
    fullName: string;
    email: string;
    kycStatus: string;
    documentCount: number;
    submittedAt: string;
  }>;
  pendingProperties: Array<{
    id: string;
    title: string;
    builderName: string;
    city: string;
    targetAmount: number;
    submittedAt: string;
  }>;
  recentActivity: Array<{
    action: string;
    resourceType: string;
    resourceId: string | null;
    actorName: string;
    createdAt: string;
  }>;
}

export const mobileAdminBff = {
  async getDashboard(): Promise<AdminDashboardView> {
    const [stats, pendingKyc, pendingProperties, recentActivity] =
      await Promise.all([
        apiGet<AdminDashboardView["stats"]>("/admin/stats"),
        apiGet<AdminDashboardView["pendingKyc"]>("/admin/kyc/pending", {
          params: { limit: 10 },
        }),
        apiGet<AdminDashboardView["pendingProperties"]>(
          "/admin/properties/pending",
          { params: { limit: 10 } }
        ),
        apiGet<AdminDashboardView["recentActivity"]>("/admin/audit-logs", {
          params: { limit: 15 },
        }),
      ]);
    return { stats, pendingKyc, pendingProperties, recentActivity };
  },

  async approveKyc(userId: string) {
    return apiPost<{ success: boolean }>(`/admin/kyc/${userId}/approve`);
  },

  async rejectKyc(userId: string, reason: string) {
    return apiPost<{ success: boolean }>(`/admin/kyc/${userId}/reject`, {
      reason,
    });
  },

  async approveProperty(propertyId: string) {
    return apiPut<{ success: boolean }>(
      `/admin/properties/${propertyId}/approve`
    );
  },

  async rejectProperty(propertyId: string, reason: string) {
    return apiPut<{ success: boolean }>(
      `/admin/properties/${propertyId}/reject`,
      { reason }
    );
  },
};
