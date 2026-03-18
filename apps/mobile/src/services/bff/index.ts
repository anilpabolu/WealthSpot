/**
 * WealthSpot Mobile – BFF Service Layer
 *
 * Same BFF pattern as web, but optimised for mobile:
 *   - Lighter payloads (fewer fields per response)
 *   - Offline-aware: graceful error handling
 *   - Prefetch-friendly pagination
 */

export { mobileDashboardBff } from "./dashboard.bff";
export { mobileMarketplaceBff } from "./marketplace.bff";
export { mobilePortfolioBff } from "./portfolio.bff";
export { mobileCommunityBff } from "./community.bff";
export { mobileProfileBff } from "./profile.bff";
