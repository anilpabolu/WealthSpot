/**
 * Mobile Marketplace BFF
 */

import { apiGet } from "../../lib/api";

export interface MobilePropertyCard {
  id: string;
  slug: string;
  title: string;
  city: string;
  cover_image: string | null;
  asset_type: string;
  target_irr: number;
  min_investment: number;
  funding_percentage: number;
}

export const mobileMarketplaceBff = {
  async getListings(params?: {
    city?: string;
    asset_type?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: MobilePropertyCard[]; total: number; page: number }> {
    return apiGet("/properties", { ...params, page_size: params?.page_size ?? 10 });
  },

  async getPropertyDetail(slug: string) {
    return apiGet<{
      id: string;
      title: string;
      tagline: string | null;
      description: string | null;
      city: string;
      cover_image: string | null;
      gallery: string[] | null;
      asset_type: string;
      target_amount: number;
      raised_amount: number;
      min_investment: number;
      unit_price: number;
      target_irr: number;
      rental_yield: number | null;
      amenities: string[] | null;
      funding_percentage: number;
      builder: { company_name: string; verified: boolean };
    }>(`/properties/${slug}`);
  },
};
