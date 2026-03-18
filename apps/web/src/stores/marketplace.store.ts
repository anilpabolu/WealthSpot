import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface MarketplaceFilters {
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
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
}

const DEFAULT_FILTERS: MarketplaceFilters = {
  city: '',
  assetType: '',
  minInvestment: [10000, 5000000],
  irrRange: [8, 25],
  status: '',
  sortBy: 'newest',
  page: 1,
  pageSize: 12,
}

export const useMarketplaceStore = create<MarketplaceState>()(
  devtools(
    (set) => ({
      filters: { ...DEFAULT_FILTERS },
      viewMode: 'grid',

      setFilter: (key, value) =>
        set(
          (state) => ({
            filters: { ...state.filters, [key]: value, page: 1 },
          }),
          false,
          `setFilter:${key}`
        ),

      resetFilters: () =>
        set({ filters: { ...DEFAULT_FILTERS } }, false, 'resetFilters'),

      setPage: (page) =>
        set(
          (state) => ({
            filters: { ...state.filters, page },
          }),
          false,
          'setPage'
        ),

      setViewMode: (mode) => set({ viewMode: mode }, false, 'setViewMode'),
    }),
    { name: 'MarketplaceStore' }
  )
)
