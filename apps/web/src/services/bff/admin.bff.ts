/**
 * Admin BFF – Admin dashboard, user management, property approvals
 */

import type { AdminDashboardView } from "@wealthspot/types";
import { apiGet, apiPost, apiPut } from "../../lib/api";

// Re-export for consumers that import from this module directly
export type { AdminDashboardView };

// ── BFF Service ───────────────────────────────────────────────────────────

export const adminBff = {
  /**
   * Admin dashboard: stats + pending reviews + recent activity.
   */
  async getDashboard(): Promise<AdminDashboardView> {
    const [stats, pendingKyc, pendingProperties, recentActivity] = await Promise.all([
      apiGet<AdminDashboardView["stats"]>("/admin/stats"),
      apiGet<AdminDashboardView["pendingKyc"]>("/admin/kyc/pending", {
        params: { limit: 10 },
      }),
      apiGet<AdminDashboardView["pendingProperties"]>("/admin/properties/pending", {
        params: { limit: 10 },
      }),
      apiGet<AdminDashboardView["recentActivity"]>("/admin/audit-logs", {
        params: { limit: 15 },
      }),
    ]);

    return { stats, pendingKyc, pendingProperties, recentActivity };
  },

  /**
   * Approve a user's KYC.
   */
  async approveKyc(userId: string) {
    return apiPost<{ success: boolean }>(`/admin/kyc/${userId}/approve`);
  },

  /**
   * Reject a user's KYC.
   */
  async rejectKyc(userId: string, reason: string) {
    return apiPost<{ success: boolean }>(`/admin/kyc/${userId}/reject`, { reason });
  },

  /**
   * Approve a property listing.
   */
  async approveProperty(propertyId: string) {
    return apiPut<{ success: boolean }>(`/admin/properties/${propertyId}/approve`);
  },

  /**
   * Reject a property listing.
   */
  async rejectProperty(propertyId: string, reason: string) {
    return apiPut<{ success: boolean }>(`/admin/properties/${propertyId}/reject`, { reason });
  },

  /**
   * Get user visit logs for dashboards.
   */
  async getUserVisits(page = 1, pageSize = 20) {
    return apiGet<{ items: any[]; total: number }>("/admin/user-visits", {
      params: { page, page_size: pageSize },
    });
  },
};
