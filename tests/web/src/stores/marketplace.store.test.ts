import { describe, expect, it, beforeEach } from 'vitest'
import { useMarketplaceStore } from '@/stores/marketplace.store'

describe('useMarketplaceStore', () => {
  beforeEach(() => {
    useMarketplaceStore.getState().resetFilters()
    useMarketplaceStore.getState().setViewMode('grid')
  })

  it('starts with default filters', () => {
    const { filters } = useMarketplaceStore.getState()
    expect(filters.search).toBe('')
    expect(filters.city).toBe('')
    expect(filters.sortBy).toBe('newest')
    expect(filters.page).toBe(1)
    expect(filters.pageSize).toBe(12)
  })

  it('setFilter updates a single filter and resets page to 1', () => {
    useMarketplaceStore.getState().setPage(3)
    useMarketplaceStore.getState().setFilter('city', 'Mumbai')

    const { filters } = useMarketplaceStore.getState()
    expect(filters.city).toBe('Mumbai')
    expect(filters.page).toBe(1) // reset after filter change
  })

  it('setPage updates page', () => {
    useMarketplaceStore.getState().setPage(5)
    expect(useMarketplaceStore.getState().filters.page).toBe(5)
  })

  it('resetFilters restores defaults', () => {
    useMarketplaceStore.getState().setFilter('city', 'Delhi')
    useMarketplaceStore.getState().setFilter('sortBy', 'irr_high')
    useMarketplaceStore.getState().resetFilters()

    const { filters } = useMarketplaceStore.getState()
    expect(filters.city).toBe('')
    expect(filters.sortBy).toBe('newest')
  })

  it('setViewMode toggles grid/list', () => {
    expect(useMarketplaceStore.getState().viewMode).toBe('grid')
    useMarketplaceStore.getState().setViewMode('list')
    expect(useMarketplaceStore.getState().viewMode).toBe('list')
  })

  it('setFilter preserves other filters', () => {
    useMarketplaceStore.getState().setFilter('city', 'Bangalore')
    useMarketplaceStore.getState().setFilter('assetType', 'Residential')

    const { filters } = useMarketplaceStore.getState()
    expect(filters.city).toBe('Bangalore')
    expect(filters.assetType).toBe('Residential')
  })
})
