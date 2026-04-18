import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
}))

import { apiGet } from '@/lib/api'

describe('mobile useAppVideos – API layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Public Videos', () => {
    it('fetches all public videos', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { page: 'vaults', sectionTag: 'hero', title: 'Hero', videoUrl: 'https://cdn/hero.mp4' },
      ])
      const result = await apiGet('/app-videos/public', { params: {} })
      expect(result).toHaveLength(1)
    })

    it('filters public videos by page', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([])
      const result = await apiGet('/app-videos/public', { params: { page: 'marketplace' } })
      expect(apiGet).toHaveBeenCalledWith('/app-videos/public', { params: { page: 'marketplace' } })
      expect(result).toHaveLength(0)
    })
  })

  describe('Public Video by Tag', () => {
    it('fetches single video by page and section tag', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        page: 'vaults',
        sectionTag: 'real_estate',
        title: 'RE Vault Video',
        videoUrl: 'https://cdn/re.mp4',
        thumbnailUrl: null,
      })
      const result = await apiGet('/app-videos/public/vaults/real_estate')
      expect(result).toHaveProperty('sectionTag', 'real_estate')
      expect(result).toHaveProperty('videoUrl')
    })
  })
})
