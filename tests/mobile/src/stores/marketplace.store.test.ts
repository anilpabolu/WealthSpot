import { describe, expect, it, beforeEach } from 'vitest'
import { useMarketplaceStore } from '@/stores/marketplace.store'

describe('mobile useMarketplaceStore', () => {
  beforeEach(() => {
    useMarketplaceStore.getState().resetFilters()
  })

  it('has correct default filters', () => {
    const { filters } = useMarketplaceStore.getState()
    expect(filters.search).toBe('')
    expect(filters.city).toBe('')
    expect(filters.sortBy).toBe('newest')
    expect(filters.page).toBe(1)
    expect(filters.pageSize).toBe(10)
  })

  it('setFilter updates search and resets page', () => {
    useMarketplaceStore.getState().setPage(3)
    expect(useMarketplaceStore.getState().filters.page).toBe(3)
    useMarketplaceStore.getState().setFilter('search', 'Bengaluru')
    const { filters } = useMarketplaceStore.getState()
    expect(filters.search).toBe('Bengaluru')
    expect(filters.page).toBe(1) // page resets
  })

  it('setFilter updates city', () => {
    useMarketplaceStore.getState().setFilter('city', 'Mumbai')
    expect(useMarketplaceStore.getState().filters.city).toBe('Mumbai')
  })

  it('setFilter updates assetType', () => {
    useMarketplaceStore.getState().setFilter('assetType', 'Commercial')
    expect(useMarketplaceStore.getState().filters.assetType).toBe('Commercial')
  })

  it('resetFilters restores defaults', () => {
    useMarketplaceStore.getState().setFilter('city', 'Pune')
    useMarketplaceStore.getState().setFilter('sortBy', 'irr_high')
    useMarketplaceStore.getState().resetFilters()
    const { filters } = useMarketplaceStore.getState()
    expect(filters.city).toBe('')
    expect(filters.sortBy).toBe('newest')
  })

  it('setPage updates page without resetting other filters', () => {
    useMarketplaceStore.getState().setFilter('city', 'Delhi')
    useMarketplaceStore.getState().setPage(5)
    const { filters } = useMarketplaceStore.getState()
    expect(filters.page).toBe(5)
    expect(filters.city).toBe('Delhi')
  })
})
