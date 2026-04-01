import { describe, expect, it, beforeEach } from 'vitest'
import { useApprovalStore } from './approval.store'

describe('useApprovalStore', () => {
  beforeEach(() => {
    useApprovalStore.getState().resetFilters()
  })

  it('starts with default filters', () => {
    const { filters } = useApprovalStore.getState()
    expect(filters.category).toBe('')
    expect(filters.status).toBe('')
    expect(filters.priority).toBe('')
    expect(filters.page).toBe(1)
    expect(filters.pageSize).toBe(20)
    expect(filters.sortBy).toBe('created_at')
    expect(filters.sortOrder).toBe('desc')
  })

  it('setFilter updates a filter and resets page', () => {
    useApprovalStore.getState().setFilter('page', 3)
    useApprovalStore.getState().setFilter('category', 'property')

    const { filters } = useApprovalStore.getState()
    expect(filters.category).toBe('property')
    expect(filters.page).toBe(1) // non-page filter resets page
  })

  it('setFilter for page does not reset page', () => {
    useApprovalStore.getState().setFilter('page', 5)
    expect(useApprovalStore.getState().filters.page).toBe(5)
  })

  it('resetFilters restores defaults', () => {
    useApprovalStore.getState().setFilter('status', 'pending')
    useApprovalStore.getState().setFilter('priority', 'high')
    useApprovalStore.getState().resetFilters()

    const { filters } = useApprovalStore.getState()
    expect(filters.status).toBe('')
    expect(filters.priority).toBe('')
  })

  it('preserves other filters when setting one', () => {
    useApprovalStore.getState().setFilter('category', 'kyc')
    useApprovalStore.getState().setFilter('status', 'approved')

    const { filters } = useApprovalStore.getState()
    expect(filters.category).toBe('kyc')
    expect(filters.status).toBe('approved')
  })
})
