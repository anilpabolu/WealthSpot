/**
 * useMediaAdmin hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '@/lib/api'

const makeMedia = (overrides = {}) => ({
  id: 'media-1',
  opportunityId: 'opp-1',
  type: 'image',
  url: '/uploads/opp/photo.jpg',
  caption: 'Main view',
  sortOrder: 0,
  ...overrides,
})

describe('useMediaAdmin – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('List media', () => {
    it('fetches media for an opportunity', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [makeMedia()] })

      const result = await api.get('/uploads/admin/opportunity/opp-1/media')
      expect(api.get).toHaveBeenCalledWith('/uploads/admin/opportunity/opp-1/media')
      expect(result.data).toHaveLength(1)
    })
  })

  describe('Upload media', () => {
    it('posts FormData for upload', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({ data: makeMedia({ id: 'media-new' }) })

      const formData = new FormData()
      formData.append('file', new Blob(['img']), 'photo.jpg')
      formData.append('type', 'image')

      await api.post('/uploads/admin/opportunity/opp-1/media', formData)
      expect(api.post).toHaveBeenCalledWith(
        '/uploads/admin/opportunity/opp-1/media',
        expect.any(FormData),
      )
    })
  })

  describe('Delete media', () => {
    it('deletes by media ID', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: null })
      await api.delete('/uploads/opportunity-media/media-1')
      expect(api.delete).toHaveBeenCalledWith('/uploads/opportunity-media/media-1')
    })
  })

  describe('Update media', () => {
    it('patches media metadata', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({
        data: makeMedia({ caption: 'Updated' }),
      })

      await api.patch('/uploads/opportunity-media/media-1', { caption: 'Updated' })
      expect(api.patch).toHaveBeenCalledWith(
        '/uploads/opportunity-media/media-1',
        { caption: 'Updated' },
      )
    })
  })
})
