/**
 * WealthSpot Web – BFF Service Layer
 *
 * The Backend-For-Frontend (BFF) pattern aggregates multiple API calls into
 * single view-specific operations.  In a monorepo like ours the BFF lives as
 * an in-app service layer (not a separate server) that:
 *   1. Aggregates & orchestrates multiple API endpoints
 *   2. Transforms backend schemas into view-ready shapes
 *   3. Adds client-side caching, optimistic updates, error handling
 *   4. Provides strongly-typed return values using @wealthspot/types
 *
 * Each file in this folder (services/bff/) is a domain-specific BFF module.
 */

export { dashboardBff } from "./dashboard.bff";
export { marketplaceBff } from "./marketplace.bff";
export { portfolioBff } from "./portfolio.bff";
export { communityBff } from "./community.bff";
export { adminBff } from "./admin.bff";
export { kycBff } from "./kyc.bff";
