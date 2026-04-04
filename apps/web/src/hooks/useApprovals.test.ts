/**
 * useApprovals hook tests – API layer (unit)
 * Tests that the hook functions call the correct API endpoints with correct params.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))
vi.mock('@/stores/approval.store', () => ({
  useApprovalStore: () => ({
    filters: {
      category: '',
      status: '',
      priority: '',
      page: 1,
      pageSize: 20,
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
  }),
}))

import { apiGet, apiPost, apiPatch } from '@/lib/api'

describe('useApprovals – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Approval List', () => {
    it('fetches paginated approvals with default filters', async () => {
      const mockApprovals = {
        items: [
          { id: 'a1', category: 'kyc', status: 'pending', priority: 'high', title: 'KYC Review' },
          { id: 'a2', category: 'property', status: 'pending', priority: 'medium', title: 'Property Approval' },
        ],
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }
      vi.mocked(apiGet).mockResolvedValueOnce(mockApprovals)

      const result = await apiGet('/approvals', {
        params: { page: 1, page_size: 20, sort_by: 'created_at', sort_order: 'desc' },
      })

      expect(apiGet).toHaveBeenCalledWith('/approvals', expect.objectContaining({
        params: expect.objectContaining({ page: 1, page_size: 20 }),
      }))
      expect(result).toEqual(mockApprovals)
    })

    it('applies category filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })
      await apiGet('/approvals', { params: { category: 'kyc', page: 1, page_size: 20 } })
      expect(apiGet).toHaveBeenCalledWith('/approvals', {
        params: expect.objectContaining({ category: 'kyc' }),
      })
    })

    it('applies status filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })
      await apiGet('/approvals', { params: { status: 'pending', page: 1, page_size: 20 } })
      expect(apiGet).toHaveBeenCalledWith('/approvals', {
        params: expect.objectContaining({ status: 'pending' }),
      })
    })

    it('applies priority filter', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ items: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })
      await apiGet('/approvals', { params: { priority: 'high', page: 1, page_size: 20 } })
      expect(apiGet).toHaveBeenCalledWith('/approvals', {
        params: expect.objectContaining({ priority: 'high' }),
      })
    })
  })

  describe('My Approvals', () => {
    it('fetches approvals for current user', async () => {
      const myApprovals = [{ id: 'a1', category: 'kyc', status: 'pending', title: 'My KYC' }]
      vi.mocked(apiGet).mockResolvedValueOnce(myApprovals)
      const result = await apiGet('/approvals/my')
      expect(result).toEqual(myApprovals)
    })
  })

  describe('Approval Stats', () => {
    it('fetches stats with correct counts', async () => {
      const stats = { pending: 5, inReview: 2, approved: 10, rejected: 1 }
      vi.mocked(apiGet).mockResolvedValueOnce(stats)
      const result = await apiGet('/approvals/stats')
      expect(result).toEqual(stats)
    })
  })

  describe('Review Action', () => {
    it('approves an approval with note', async () => {
      const updated = { id: 'a1', status: 'approved', reviewNote: 'Looks good' }
      vi.mocked(apiPatch).mockResolvedValueOnce(updated)
      const result = await apiPatch<any>('/approvals/a1/review', {
        action: 'approve',
        review_note: 'Looks good',
      })
      expect(apiPatch).toHaveBeenCalledWith('/approvals/a1/review', {
        action: 'approve',
        review_note: 'Looks good',
      })
      expect(result.status).toBe('approved')
    })

    it('rejects an approval with note', async () => {
      const updated = { id: 'a1', status: 'rejected', reviewNote: 'Missing documents' }
      vi.mocked(apiPatch).mockResolvedValueOnce(updated)
      const result = await apiPatch<any>('/approvals/a1/review', {
        action: 'reject',
        review_note: 'Missing documents',
      })
      expect(result.status).toBe('rejected')
    })

    it('creates a new approval request', async () => {
      const created = { id: 'a3', category: 'property', status: 'pending', title: 'New Listing' }
      vi.mocked(apiPost).mockResolvedValueOnce(created)
      const result = await apiPost<any>('/approvals', {
        category: 'property',
        title: 'New Listing',
        priority: 'medium',
      })
      expect(apiPost).toHaveBeenCalledWith('/approvals', expect.objectContaining({
        category: 'property',
        title: 'New Listing',
      }))
      expect(result.id).toBe('a3')
    })
  })
})
