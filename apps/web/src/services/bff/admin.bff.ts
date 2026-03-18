/**
 * Admin BFF – Admin dashboard, user management, property approvals
 */

import { apiGet, apiPost, apiPut } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

export interface AdminDashboardView {
  stats: {
    total_users: number;
    total_investors: number;
    total_builders: number;
    total_properties: number;
    active_properties: number;
    total_invested: number;
    total_transactions: number;
    kyc_pending_count: number;
  };
  pendingKyc: Array<{
    user_id: string;
    full_name: string;
    email: string;
    kyc_status: string;
    document_count: number;
    submitted_at: string;
  }>;
  pendingProperties: Array<{
    id: string;
    title: string;
    builder_name: string;
    city: string;
    target_amount: number;
    submitted_at: string;
  }>;
  recentActivity: Array<{
    action: string;
    resource_type: string;
    resource_id: string | null;
    actor_name: string;
    created_at: string;
  }>;
}

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
};
