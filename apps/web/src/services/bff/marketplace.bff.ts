/**
 * Marketplace BFF – Property listing, filtering, & detail aggregation
 */

import type {
  MarketplaceFilters,
  MarketplaceCard,
  MarketplaceView,
  PropertyDetailView,
} from "@wealthspot/types";
import { apiGet } from "../../lib/api";

// Re-export for consumers that import from this module directly
export type { MarketplaceFilters, MarketplaceCard, MarketplaceView, PropertyDetailView };

// ── BFF Service ───────────────────────────────────────────────────────────

export const marketplaceBff = {
  /**
   * Fetch paginated & filtered marketplace listings.
   */
  async getListings(filters: MarketplaceFilters = {}): Promise<MarketplaceView> {
    // Map camelCase filter keys to snake_case API query params
    const params: Record<string, unknown> = {};
    if (filters.city !== undefined) params.city = filters.city;
    if (filters.assetType !== undefined) params.asset_type = filters.assetType;
    if (filters.status !== undefined) params.status = filters.status;
    if (filters.minAmount !== undefined) params.min_amount = filters.minAmount;
    if (filters.maxAmount !== undefined) params.max_amount = filters.maxAmount;
    if (filters.search !== undefined) params.search = filters.search;
    if (filters.page !== undefined) params.page = filters.page;
    if (filters.pageSize !== undefined) params.page_size = filters.pageSize;
    if (filters.sortBy !== undefined) params.sort_by = filters.sortBy;
    if (filters.sortOrder !== undefined) params.sort_order = filters.sortOrder;

    const result = await apiGet<{
      items: MarketplaceCard[];
      total: number;
      page: number;
      totalPages: number;
    }>("/properties", { params });

    return {
      properties: result.items,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      filtersApplied: filters,
    };
  },

  /**
   * Fetch full property detail + builder info + similar properties.
   * Aggregates 3 API calls in parallel.
   */
  async getPropertyDetail(slug: string): Promise<PropertyDetailView> {
    const [detail, similar] = await Promise.all([
      apiGet<PropertyDetailView["property"] & { builder: PropertyDetailView["builder"] }>(
        `/properties/${slug}`
      ),
      apiGet<MarketplaceCard[]>(`/properties/${slug}/similar`, { params: { limit: 3 } }),
    ]);

    const { builder, ...property } = detail;

    return {
      property,
      builder,
      similarProperties: similar,
    };
  },
};
