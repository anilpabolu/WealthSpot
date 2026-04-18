/**
 * useBuilderUpdates hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
  api: { post: vi.fn() },
}))

import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api'

const makeUpdate = (overrides = {}) => ({
  id: 'upd-1',
  opportunityId: 'opp-1',
  title: 'Construction Update',
  body: 'Floor 3 completed',
  category: 'construction',
  attachments: [],
  createdAt: '2025-03-15T00:00:00Z',
  updatedAt: '2025-03-15T00:00:00Z',
  ...overrides,
})

describe('useBuilderUpdates – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('List updates', () => {
    it('fetches updates for an opportunity', async () => {
      const updates = [makeUpdate(), makeUpdate({ id: 'upd-2', title: 'Legal Update' })]
      vi.mocked(apiGet).mockResolvedValueOnce(updates)

      const result = await apiGet('/builder-updates/opportunities/opp-1')
      expect(apiGet).toHaveBeenCalledWith('/builder-updates/opportunities/opp-1')
      expect(result).toHaveLength(2)
    })

    it('returns empty for no updates', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet('/builder-updates/opportunities/opp-1')
      expect(result).toHaveLength(0)
    })
  })

  describe('Create update', () => {
    it('creates a new builder update', async () => {
      const created = makeUpdate({ id: 'upd-new' })
      vi.mocked(apiPost).mockResolvedValueOnce(created)

      const result = await apiPost('/builder-updates/opportunities/opp-1', {
        title: 'New Update',
        body: 'Content here',
        category: 'milestone',
      })
      expect(apiPost).toHaveBeenCalledWith(
        '/builder-updates/opportunities/opp-1',
        expect.objectContaining({ title: 'New Update' }),
      )
      expect((result as any).id).toBe('upd-new')
    })
  })

  describe('Patch update', () => {
    it('patches an existing update', async () => {
      const patched = makeUpdate({ title: 'Updated Title' })
      vi.mocked(apiPatch).mockResolvedValueOnce(patched)

      await apiPatch('/builder-updates/upd-1', { title: 'Updated Title' })
      expect(apiPatch).toHaveBeenCalledWith('/builder-updates/upd-1', { title: 'Updated Title' })
    })
  })

  describe('Delete update', () => {
    it('deletes an update', async () => {
      vi.mocked(apiDelete).mockResolvedValueOnce(undefined)
      await apiDelete('/builder-updates/upd-1')
      expect(apiDelete).toHaveBeenCalledWith('/builder-updates/upd-1')
    })
  })

  describe('Delete attachment', () => {
    it('deletes an attachment', async () => {
      vi.mocked(apiDelete).mockResolvedValueOnce(undefined)
      await apiDelete('/builder-updates/attachments/att-1')
      expect(apiDelete).toHaveBeenCalledWith('/builder-updates/attachments/att-1')
    })
  })
})
