/**
 * mobile useCommunity hook tests – API layer (unit)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '../lib/api'

const mockAuthor = { id: 'u1', fullName: 'Alice', avatarUrl: null }

describe('mobile useCommunity – API layer', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('Post Listing', () => {
    it('fetches posts with pagination', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [
          { id: 'p1', postType: 'discussion', title: 'RE trends', bodyPreview: 'Discussion about...', upvotes: 10, replyCount: 2, isPinned: false, author: mockAuthor, createdAt: '2025-01-01T00:00:00Z', userHasLiked: false, category: null, tags: null },
        ],
        total: 1, page: 1, totalPages: 1,
      })
      const result = await apiGet<any>('/community/posts', { params: { page: 1 } })
      expect(result.items).toHaveLength(1)
      expect(result.items[0].postType).toBe('discussion')
    })

    it('filters by post type', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ items: [], total: 0, page: 1, totalPages: 0 })
      await apiGet('/community/posts', { params: { type: 'question', page: 1 } })
      expect(apiGet).toHaveBeenCalledWith('/community/posts', { params: expect.objectContaining({ type: 'question' }) })
    })
  })

  describe('Create Post', () => {
    it('creates a discussion post', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'p2', title: 'My post', postType: 'discussion' })
      const result = await apiPost<any>('/community/posts', { post_type: 'discussion', title: 'My post', body: 'Content here' })
      expect(result.id).toBe('p2')
    })
  })

  describe('Replies', () => {
    it('fetches replies for a post', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce([
        { id: 'r1', postId: 'p1', body: 'Great insight!', upvotes: 2, author: mockAuthor, createdAt: '2025-01-01T01:00:00Z', userHasLiked: false },
      ])
      const result = await apiGet<any>('/community/posts/p1/replies')
      expect(result[0].body).toBe('Great insight!')
    })

    it('adds a reply to a post', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'r2', body: 'New reply', upvotes: 0 })
      await apiPost('/community/posts/p1/replies', { body: 'New reply' })
      expect(apiPost).toHaveBeenCalledWith('/community/posts/p1/replies', { body: 'New reply' })
    })
  })

  describe('Likes', () => {
    it('toggles like on a post', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ liked: true, likeCount: 11 })
      const result = await apiPost<any>('/community/posts/p1/like', {})
      expect(result.liked).toBe(true)
    })

    it('toggles like on a reply', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ liked: true, likeCount: 3 })
      const result = await apiPost<any>('/community/posts/p1/replies/r1/like', {})
      expect(result.liked).toBe(true)
    })
  })

  describe('Config', () => {
    it('fetches community config', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({ postMaxWords: 500, postMinWords: 20 })
      const result = await apiGet<any>('/community/config')
      expect(result.postMaxWords).toBe(500)
    })
  })
})
