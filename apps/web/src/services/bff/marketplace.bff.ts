/**
 * Marketplace BFF – Property listing, filtering, & detail aggregation
 */

import { apiGet } from "../../lib/api";

// ── Types ─────────────────────────────────────────────────────────────────

export interface MarketplaceFilters {
  city?: string;
  asset_type?: string;
  status?: string;
  min_amount?: number;
  max_amount?: number;
  min_irr?: number;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface MarketplaceCard {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  asset_type: string;
  status: string;
  city: string;
  cover_image: string | null;
  target_amount: number;
  raised_amount: number;
  min_investment: number;
  target_irr: number;
  rental_yield: number | null;
  investor_count: number;
  funding_percentage: number;
}

export interface MarketplaceView {
  properties: MarketplaceCard[];
  total: number;
  page: number;
  total_pages: number;
  filters_applied: MarketplaceFilters;
}

export interface PropertyDetailView {
  property: MarketplaceCard & {
    description: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    area_sqft: number | null;
    bedrooms: number | null;
    possession_date: string | null;
    rera_id: string | null;
    gallery: string[] | null;
    documents: Record<string, unknown> | null;
    amenities: string[] | null;
    launch_date: string | null;
  };
  builder: {
    company_name: string;
    rera_number: string | null;
    verified: boolean;
    logo_url: string | null;
  };
  similarProperties: MarketplaceCard[];
}

// ── BFF Service ───────────────────────────────────────────────────────────

export const marketplaceBff = {
  /**
   * Fetch paginated & filtered marketplace listings.
   */
  async getListings(filters: MarketplaceFilters = {}): Promise<MarketplaceView> {
    const params = { ...filters };
    // Clean undefined values
    Object.keys(params).forEach((k) => {
      if (params[k as keyof typeof params] === undefined) delete params[k as keyof typeof params];
    });

    const result = await apiGet<{
      items: MarketplaceCard[];
      total: number;
      page: number;
      total_pages: number;
    }>("/properties", { params });

    return {
      properties: result.items,
      total: result.total,
      page: result.page,
      total_pages: result.total_pages,
      filters_applied: filters,
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
