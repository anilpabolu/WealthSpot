import { describe, expect, it, beforeEach } from 'vitest'
import { useApprovalStore } from '@/stores/approval.store'

describe('mobile useApprovalStore', () => {
  beforeEach(() => {
    useApprovalStore.getState().resetFilters()
  })

  it('has correct default filters', () => {
    const { filters } = useApprovalStore.getState()
    expect(filters.category).toBe('')
    expect(filters.status).toBe('')
    expect(filters.priority).toBe('')
    expect(filters.page).toBe(1)
    expect(filters.pageSize).toBe(20)
    expect(filters.sortBy).toBe('created_at')
    expect(filters.sortOrder).toBe('desc')
  })

  it('setFilter updates category and resets page', () => {
    useApprovalStore.getState().setFilter('page', 5)
    useApprovalStore.getState().setFilter('category', 'opportunity')
    const { filters } = useApprovalStore.getState()
    expect(filters.category).toBe('opportunity')
    expect(filters.page).toBe(1)
  })

  it('setFilter with page key does not reset page', () => {
    useApprovalStore.getState().setFilter('page', 3)
    expect(useApprovalStore.getState().filters.page).toBe(3)
  })

  it('resetFilters restores defaults', () => {
    useApprovalStore.getState().setFilter('status', 'pending')
    useApprovalStore.getState().setFilter('priority', 'high')
    useApprovalStore.getState().resetFilters()
    const { filters } = useApprovalStore.getState()
    expect(filters.status).toBe('')
    expect(filters.priority).toBe('')
  })
})
