import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
  api: { post: vi.fn() },
}))

import { apiGet, apiPost, apiPatch, apiDelete, api } from '@/lib/api'

describe('useAppVideos – API layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Public Endpoints', () => {
    it('fetches all active videos', async () => {
      const videos = [
        { page: 'vaults', sectionTag: 'hero', title: 'Hero Video', videoUrl: 'https://example.com/v1.mp4' },
        { page: 'vaults', sectionTag: 'real_estate', title: 'RE Video', videoUrl: 'https://example.com/v2.mp4' },
      ]
      vi.mocked(apiGet).mockResolvedValueOnce(videos)
      const result = await apiGet('/app-videos/public', { params: {} })
      expect(result).toHaveLength(2)
    })

    it('fetches videos filtered by page', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([{ page: 'vaults', sectionTag: 'hero', title: 'Hero' }])
      const result = await apiGet('/app-videos/public', { params: { page: 'vaults' } })
      expect(apiGet).toHaveBeenCalledWith('/app-videos/public', { params: { page: 'vaults' } })
      expect(result).toHaveLength(1)
    })

    it('fetches a single video by page + section_tag', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        page: 'vaults', sectionTag: 'hero', title: 'Hero Video', videoUrl: 'https://example.com/hero.mp4',
      })
      const result = await apiGet('/app-videos/public/vaults/hero')
      expect(result).toHaveProperty('sectionTag', 'hero')
    })
  })

  describe('Admin Endpoints', () => {
    it('fetches pages meta (pages + sections)', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        pages: [{ value: 'vaults', label: 'Vaults Page' }],
        sections: { vaults: [{ value: 'hero', label: 'Hero Section' }] },
      })
      const result = await apiGet('/app-videos/pages')
      expect(result).toHaveProperty('pages')
      expect(result).toHaveProperty('sections')
    })

    it('lists admin videos', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'v1', page: 'vaults', sectionTag: 'hero', isActive: true },
      ])
      const result = await apiGet('/app-videos/admin')
      expect(result).toHaveLength(1)
    })

    it('creates a new video slot', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'v-new', page: 'marketplace', sectionTag: 'intro' })
      const result = await apiPost('/app-videos/admin', {
        page: 'marketplace',
        section_tag: 'intro',
        title: 'Intro Video',
        video_url: 'https://example.com/intro.mp4',
      })
      expect(result).toHaveProperty('id', 'v-new')
    })

    it('updates video metadata', async () => {
      vi.mocked(apiPatch).mockResolvedValueOnce({ id: 'v1', title: 'Updated Title' })
      await apiPatch('/app-videos/admin/v1', { title: 'Updated Title' })
      expect(apiPatch).toHaveBeenCalledWith('/app-videos/admin/v1', { title: 'Updated Title' })
    })

    it('deletes a video slot', async () => {
      vi.mocked(apiDelete).mockResolvedValueOnce(undefined)
      await apiDelete('/app-videos/admin/v1')
      expect(apiDelete).toHaveBeenCalledWith('/app-videos/admin/v1')
    })

    it('uploads a video file via multipart form', async () => {
      const mockResp = { data: { id: 'v1', videoUrl: 'https://minio/video.mp4' } }
      vi.mocked(api.post).mockResolvedValueOnce(mockResp)
      const blob = new Blob(['video-content'], { type: 'video/mp4' })
      const file = new File([blob], 'video.mp4', { type: 'video/mp4' })
      const formData = new FormData()
      formData.append('file', file)
      const result = await api.post('/app-videos/admin/v1/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      expect(api.post).toHaveBeenCalledWith(
        '/app-videos/admin/v1/upload',
        expect.any(FormData),
        expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
      )
      expect(result.data).toHaveProperty('videoUrl')
    })
  })
})
