/**
 * useSiteContent hook tests – API layer (unit)
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

const makeContent = (overrides = {}) => ({
  id: 'sc-1',
  page: 'marketplace',
  sectionTag: 'hero_title',
  content: 'Welcome to WealthSpot',
  isActive: true,
  ...overrides,
})

describe('useSiteContent – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Public page content', () => {
    it('fetches content by page', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [makeContent()] })

      const result = await api.get('/site-content/page/marketplace')
      expect(api.get).toHaveBeenCalledWith('/site-content/page/marketplace')
      expect(result.data).toHaveLength(1)
    })

    it('returns empty for unknown page', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({ data: [] })
      const result = await api.get('/site-content/page/nonexistent')
      expect(result.data).toHaveLength(0)
    })
  })

  describe('Admin CRUD', () => {
    it('fetches all content (admin)', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [makeContent(), makeContent({ id: 'sc-2', isActive: false })],
      })
      const result = await api.get('/site-content/admin/all')
      expect(result.data).toHaveLength(2)
    })

    it('creates content', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: makeContent({ id: 'sc-new' }),
      })
      await api.post('/site-content/admin/create', {
        page: 'home',
        sectionTag: 'cta',
        content: 'Join now!',
      })
      expect(api.post).toHaveBeenCalledWith('/site-content/admin/create', expect.objectContaining({
        page: 'home',
      }))
    })

    it('updates content', async () => {
      vi.mocked(api.patch).mockResolvedValueOnce({
        data: makeContent({ content: 'Updated text' }),
      })
      await api.patch('/site-content/admin/sc-1', { content: 'Updated text' })
      expect(api.patch).toHaveBeenCalled()
    })

    it('deletes content', async () => {
      vi.mocked(api.delete).mockResolvedValueOnce({ data: null })
      await api.delete('/site-content/admin/sc-1')
      expect(api.delete).toHaveBeenCalledWith('/site-content/admin/sc-1')
    })
  })
})
