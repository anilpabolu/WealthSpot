/**
 * Marketplace filter store – mirrors web's marketplace.store.ts.
 */

import { create } from 'zustand'

export interface MarketplaceFilters {
  search: string
  city: string
  assetType: string
  minInvestment: [number, number]
  irrRange: [number, number]
  status: string
  sortBy: 'irr_high' | 'irr_low' | 'newest' | 'funding' | 'price_low' | 'price_high'
  page: number
  pageSize: number
}

interface MarketplaceState {
  filters: MarketplaceFilters
  setFilter: <K extends keyof MarketplaceFilters>(key: K, value: MarketplaceFilters[K]) => void
  resetFilters: () => void
  setPage: (page: number) => void
}

const DEFAULT_FILTERS: MarketplaceFilters = {
  search: '',
  city: '',
  assetType: '',
  minInvestment: [10000, 5000000],
  irrRange: [8, 25],
  status: '',
  sortBy: 'newest',
  page: 1,
  pageSize: 10,
}

export const useMarketplaceStore = create<MarketplaceState>((set) => ({
  filters: { ...DEFAULT_FILTERS },

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value, page: 1 },
    })),

  resetFilters: () =>
    set({ filters: { ...DEFAULT_FILTERS } }),

  setPage: (page) =>
    set((state) => ({
      filters: { ...state.filters, page },
    })),
}))
