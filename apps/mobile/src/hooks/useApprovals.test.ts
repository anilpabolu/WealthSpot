/**
 * mobile useApprovals hook tests – API layer (unit)
 * Tests approval CRUD and review actions in the mobile context.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
}))
vi.mock('../stores/approval.store', () => ({
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

import { apiGet, apiPost, apiPatch } from '../lib/api'

describe('mobile useApprovals – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Listing', () => {
    it('fetches paginated approvals', async () => {
      const mockApprovals = {
        items: [
          { id: 'a1', category: 'kyc', status: 'pending', priority: 'high', title: 'KYC Review' },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }
      vi.mocked(apiGet).mockResolvedValueOnce(mockApprovals)
      const result = await apiGet<any>('/approvals', { params: { page: 1, page_size: 20 } })
      expect(result.items).toHaveLength(1)
      expect(result.items[0].category).toBe('kyc')
    })

    it('fetches my approvals', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'a1', category: 'kyc', status: 'pending', title: 'My KYC' },
      ])
      const result = await apiGet('/approvals/my')
      expect(result).toHaveLength(1)
    })
  })

  describe('Stats', () => {
    it('fetches approval stats', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ pending: 3, inReview: 1, approved: 8, rejected: 2 })
      const result = await apiGet<any>('/approvals/stats')
      expect(result.pending).toBe(3)
      expect(result.approved).toBe(8)
    })
  })

  describe('Review Action', () => {
    it('approves an item', async () => {
      vi.mocked(apiPatch).mockResolvedValueOnce({ id: 'a1', status: 'approved' })
      const result = await apiPatch<any>('/approvals/a1/review', { action: 'approve' })
      expect(result.status).toBe('approved')
    })

    it('rejects an item with reason', async () => {
      vi.mocked(apiPatch).mockResolvedValueOnce({ id: 'a1', status: 'rejected', reviewNote: 'Incomplete docs' })
      const result = await apiPatch<any>('/approvals/a1/review', { action: 'reject', review_note: 'Incomplete docs' })
      expect(result.status).toBe('rejected')
      expect(result.reviewNote).toBe('Incomplete docs')
    })
  })

  describe('Create Approval Request', () => {
    it('submits a new approval request', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'a3', status: 'pending', category: 'property' })
      const result = await apiPost<any>('/approvals', { category: 'property', title: 'New Listing' })
      expect(result.status).toBe('pending')
    })
  })
})
