/**
 * mobile communityBff tests – functional
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}))

import { apiGet, apiPost } from '@/lib/api'
import { mobileCommunityBff } from '@/services/bff/community.bff'

const makePost = (id: string, isPinned = false) => ({
  id,
  postType: 'discussion',
  title: `Post ${id}`,
  bodyPreview: 'Preview text',
  category: 'general',
  tags: null,
  upvotes: 3,
  replyCount: 1,
  isPinned,
  author: { id: 'u1', fullName: 'Alice', avatarUrl: null },
  createdAt: '2025-01-01T00:00:00Z',
})

describe('mobile communityBff functional tests', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('getFeed', () => {
    it('separates pinned and non-pinned posts', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [makePost('p1', true), makePost('p2'), makePost('p3')],
        total: 3,
        page: 1,
        totalPages: 1,
      })

      const result = await mobileCommunityBff.getFeed()

      expect(apiGet).toHaveBeenCalledWith('/community/posts', {
        params: { page: 1, page_size: 15 },
      })
      expect(result.pinned).toHaveLength(1)
      expect(result.pinned[0].id).toBe('p1')
      expect(result.posts).toHaveLength(2)
    })

    it('passes category filter when provided', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
      })

      await mobileCommunityBff.getFeed({ category: 'real-estate', page: 2, pageSize: 10 })

      expect(apiGet).toHaveBeenCalledWith('/community/posts', {
        params: { category: 'real-estate', page: 2, page_size: 10 },
      })
    })

    it('returns empty feed with zero totals when no posts', async () => {
      vi.mocked(apiGet).mockResolvedValueOnce({
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
      })

      const result = await mobileCommunityBff.getFeed()
      expect(result.posts).toHaveLength(0)
      expect(result.pinned).toHaveLength(0)
      expect(result.total).toBe(0)
    })
  })

  describe('getPostDetail', () => {
    it('fetches post and replies in parallel', async () => {
      const post = { ...makePost('p1'), body: 'Full body content' }
      const replies = [
        { id: 'r1', body: 'Reply text', upvotes: 1, author: { id: 'u2', fullName: 'Bob', avatarUrl: null }, createdAt: '2025-01-02T00:00:00Z' },
      ]

      vi.mocked(apiGet)
        .mockResolvedValueOnce(post)
        .mockResolvedValueOnce(replies)

      const result = await mobileCommunityBff.getPostDetail('p1')

      expect(apiGet).toHaveBeenCalledWith('/community/posts/p1')
      expect(apiGet).toHaveBeenCalledWith('/community/posts/p1/replies')
      expect(result.post.body).toBe('Full body content')
      expect(result.replies).toHaveLength(1)
    })
  })

  describe('createPost', () => {
    it('posts to the community endpoint', async () => {
      vi.mocked(apiPost).mockResolvedValueOnce({ id: 'new-post' })

      const result = await mobileCommunityBff.createPost({
        title: 'New Discussion',
        body: 'Discussion body',
        postType: 'discussion',
        category: 'general',
      })

      expect(apiPost).toHaveBeenCalledWith('/community/posts', expect.objectContaining({ title: 'New Discussion' }))
      expect(result).toEqual({ id: 'new-post' })
    })
  })
})
