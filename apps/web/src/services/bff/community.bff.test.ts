import { beforeEach, describe, expect, it, vi } from 'vitest'
import { communityBff } from './community.bff'
import { apiGet, apiPost } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

describe('communityBff', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getFeed', () => {
    it('separates pinned posts from regular posts', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [
          { id: '1', title: 'Pinned', is_pinned: true },
          { id: '2', title: 'Regular', is_pinned: false },
          { id: '3', title: 'Also Pinned', is_pinned: true },
        ],
        total: 3,
        page: 1,
        total_pages: 1,
      } as any)

      const result = await communityBff.getFeed({ category: 'general' })

      expect(apiGet).toHaveBeenCalledWith('/community/posts', { params: { category: 'general' } })
      expect(result.pinned).toHaveLength(2)
      expect(result.posts).toHaveLength(1)
      expect(result.posts[0]?.title).toBe('Regular')
    })
  })

  describe('getPostDetail', () => {
    it('aggregates post and replies', async () => {
      const mockPost = { id: '1', title: 'Test Post', body: 'Full body' }
      const mockReplies = [{ id: 'r1', body: 'Reply 1' }]

      vi.mocked(apiGet)
        .mockResolvedValueOnce(mockPost)
        .mockResolvedValueOnce(mockReplies)

      const result = await communityBff.getPostDetail('1')

      expect(apiGet).toHaveBeenCalledWith('/community/posts/1')
      expect(apiGet).toHaveBeenCalledWith('/community/posts/1/replies')
      expect(result.post).toEqual(mockPost)
      expect(result.replies).toEqual(mockReplies)
    })
  })

  describe('createPost', () => {
    it('sends post creation payload', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'new-post' })

      const payload = { title: 'New Post', body: 'Content', category: 'general' }
      const result = await communityBff.createPost(payload)

      expect(apiPost).toHaveBeenCalledWith('/community/posts', payload)
      expect(result.id).toBe('new-post')
    })
  })

  describe('replyToPost', () => {
    it('sends reply payload', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'new-reply' })

      const result = await communityBff.replyToPost('1', 'Great post!')

      expect(apiPost).toHaveBeenCalledWith('/community/posts/1/replies', { body: 'Great post!' })
      expect(result.id).toBe('new-reply')
    })
  })
})
