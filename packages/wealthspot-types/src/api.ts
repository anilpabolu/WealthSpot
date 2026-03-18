// ============================================================================
// WealthSpot API Response Types
// Generic wrappers for all API responses
// ============================================================================

/** Standard API success response */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/** Standard API error response */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/** Auth token pair returned after login */
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

/** Webhook event payload from Razorpay */
export interface RazorpayWebhookEvent {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        method: string;
      };
    };
  };
}

/** S3 presigned upload URL response */
export interface PresignedUploadUrl {
  upload_url: string;
  file_key: string;
  expires_in: number;
}

/** Dashboard summary stats (admin) */
export interface AdminDashboardStats {
  total_users: number;
  total_investors: number;
  total_builders: number;
  total_properties: number;
  active_properties: number;
  total_invested: number;
  total_transactions: number;
  kyc_pending_count: number;
}

/** Lender dashboard summary */
export interface LenderDashboardStats {
  active_loans: number;
  total_lent: number;
  total_interest_earned: number;
  upcoming_payments: number;
}
