/**
 * Mobile Marketplace BFF – matches web's marketplace.bff.ts patterns.
 */

import { apiGet } from "../../lib/api";

export interface MarketplaceFilters {
  city?: string;
  assetType?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  minIrr?: number;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface MarketplaceCard {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  assetType: string;
  status: string;
  city: string;
  coverImage: string | null;
  targetAmount: number;
  raisedAmount: number;
  minInvestment: number;
  targetIrr: number;
  rentalYield: number | null;
  investorCount: number;
  fundingPercentage: number;
}

export interface MarketplaceView {
  properties: MarketplaceCard[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PropertyDetailView {
  property: MarketplaceCard & {
    description: string | null;
    address: string | null;
    areaSqft: number | null;
    bedrooms: number | null;
    possessionDate: string | null;
    reraId: string | null;
    gallery: string[] | null;
    amenities: string[] | null;
    launchDate: string | null;
  };
  builder: {
    companyName: string;
    reraNumber: string | null;
    verified: boolean;
    logoUrl: string | null;
  };
  similarProperties: MarketplaceCard[];
}

export const mobileMarketplaceBff = {
  async getListings(
    filters: MarketplaceFilters = {}
  ): Promise<MarketplaceView> {
    const params: Record<string, unknown> = {};
    if (filters.city) params.city = filters.city;
    if (filters.assetType) params.asset_type = filters.assetType;
    if (filters.status) params.status = filters.status;
    if (filters.minAmount) params.min_amount = filters.minAmount;
    if (filters.maxAmount) params.max_amount = filters.maxAmount;
    if (filters.minIrr) params.min_irr = filters.minIrr;
    if (filters.search) params.search = filters.search;
    if (filters.sortBy) params.sort_by = filters.sortBy;
    if (filters.sortOrder) params.sort_order = filters.sortOrder;
    params.page = filters.page ?? 1;
    params.page_size = filters.pageSize ?? 10;

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
    };
  },

  async getPropertyDetail(slug: string): Promise<PropertyDetailView> {
    const [detail, similar] = await Promise.all([
      apiGet<
        PropertyDetailView["property"] & {
          builder: PropertyDetailView["builder"];
        }
      >(`/properties/${slug}`),
      apiGet<MarketplaceCard[]>(`/properties/${slug}/similar`, {
        params: { limit: 3 },
      }),
    ]);

    const { builder, ...property } = detail;
    return { property, builder, similarProperties: similar };
  },
};
