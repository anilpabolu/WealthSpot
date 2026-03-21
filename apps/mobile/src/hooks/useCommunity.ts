/**
 * useCommunity – React Query hooks for community interactions.
 * Mirrors web's useCommunity.ts.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '../lib/api'

export type PostType = 'discussion' | 'question' | 'insight' | 'poll' | 'announcement'

export interface CommunityAuthor {
  id: string
  fullName: string
  avatarUrl?: string | null
}

export interface CommunityPostSummary {
  id: string
  postType: PostType
  title: string
  bodyPreview: string
  category: string | null
  tags: string[] | null
  upvotes: number
  replyCount: number
  isPinned: boolean
  author: CommunityAuthor | null
  createdAt: string
  userHasLiked: boolean
}

export interface CommunityPost extends CommunityPostSummary {
  body: string
  updatedAt: string
}

export interface CommunityReply {
  id: string
  postId: string
  userId: string
  body: string
  upvotes: number
  isApproved: boolean
  approvalStatus: string | null
  createdAt: string
  author: CommunityAuthor | null
  userHasLiked: boolean
}

export interface PaginatedPosts {
  items: CommunityPostSummary[]
  total: number
  page: number
  totalPages: number
}

export interface LikeResponse {
  liked: boolean
  likeCount: number
}

export interface CommunityConfig {
  postMaxWords: number
  postMinWords: number
}

export interface PostFilters {
  type?: PostType
  category?: string
  search?: string
  sort?: 'latest' | 'popular' | 'pinned'
  page?: number
  pageSize?: number
}

export interface CreatePostPayload {
  title: string
  body: string
  postType: PostType
  category?: string
  tags?: string[]
}

export interface CreateReplyPayload {
  body: string
}

export const communityKeys = {
  all: ['community'] as const,
  posts: (filters: PostFilters) => ['community', 'posts', filters] as const,
  post: (id: string) => ['community', 'post', id] as const,
  replies: (postId: string) => ['community', 'replies', postId] as const,
  config: () => ['community', 'config'] as const,
}

export function useCommunityPosts(filters: PostFilters = {}) {
  const params: Record<string, unknown> = {}
  if (filters.type && filters.type !== ('all' as PostType)) params.type = filters.type
  if (filters.category && filters.category !== 'all') params.category = filters.category
  if (filters.search) params.search = filters.search
  if (filters.sort) params.sort = filters.sort
  if (filters.page) params.page = filters.page
  if (filters.pageSize) params.page_size = filters.pageSize

  return useQuery<PaginatedPosts>({
    queryKey: communityKeys.posts(filters),
    queryFn: () => apiGet<PaginatedPosts>('/community/posts', { params }),
  })
}

export function useCommunityPost(id: string | undefined) {
  return useQuery<CommunityPost>({
    queryKey: communityKeys.post(id ?? ''),
    queryFn: () => apiGet<CommunityPost>(`/community/posts/${id}`),
    enabled: !!id,
  })
}

export function useCommunityReplies(postId: string, enabled = false) {
  return useQuery<CommunityReply[]>({
    queryKey: communityKeys.replies(postId),
    queryFn: () => apiGet<CommunityReply[]>(`/community/posts/${postId}/replies`),
    enabled,
  })
}

export function useCommunityConfig() {
  return useQuery<CommunityConfig>({
    queryKey: communityKeys.config(),
    queryFn: () => apiGet<CommunityConfig>('/community/config'),
    staleTime: 5 * 60_000,
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation<CommunityPost, Error, CreatePostPayload>({
    mutationFn: (payload) =>
      apiPost<CommunityPost>('/community/posts', {
        title: payload.title,
        body: payload.body,
        post_type: payload.postType,
        category: payload.category,
        tags: payload.tags,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community', 'posts'] })
    },
  })
}

export function useCreateReply(postId: string) {
  const qc = useQueryClient()
  return useMutation<CommunityReply, Error, CreateReplyPayload>({
    mutationFn: (payload) =>
      apiPost<CommunityReply>(`/community/posts/${postId}/replies`, { body: payload.body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: communityKeys.replies(postId) })
      qc.invalidateQueries({ queryKey: ['community', 'posts'] })
    },
  })
}

export function useLikePost(filters: PostFilters = {}) {
  const qc = useQueryClient()

  type LikePostCtx = { prev?: PaginatedPosts }

  return useMutation<LikeResponse, Error, { postId: string; currentlyLiked: boolean }, LikePostCtx>({
    mutationFn: ({ postId }) =>
      apiPost<LikeResponse>(`/community/posts/${postId}/like`),

    onMutate: async ({ postId, currentlyLiked }) => {
      const key = communityKeys.posts(filters)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<PaginatedPosts>(key)

      if (prev) {
        qc.setQueryData<PaginatedPosts>(key, {
          ...prev,
          items: prev.items.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  userHasLiked: !currentlyLiked,
                  upvotes: currentlyLiked ? p.upvotes - 1 : p.upvotes + 1,
                }
              : p
          ),
        })
      }
      return { prev }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(communityKeys.posts(filters), ctx.prev)
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['community', 'posts'] })
    },
  })
}

export function useLikeReply(postId: string) {
  const qc = useQueryClient()

  type LikeReplyCtx = { prev?: CommunityReply[] }

  return useMutation<LikeResponse, Error, { replyId: string; currentlyLiked: boolean }, LikeReplyCtx>({
    mutationFn: ({ replyId }) =>
      apiPost<LikeResponse>(`/community/posts/${postId}/replies/${replyId}/like`),

    onMutate: async ({ replyId, currentlyLiked }) => {
      const key = communityKeys.replies(postId)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<CommunityReply[]>(key)
      if (prev) {
        qc.setQueryData<CommunityReply[]>(
          key,
          prev.map((r) =>
            r.id === replyId
              ? {
                  ...r,
                  userHasLiked: !currentlyLiked,
                  upvotes: currentlyLiked ? r.upvotes - 1 : r.upvotes + 1,
                }
              : r
          )
        )
      }
      return { prev }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(communityKeys.replies(postId), ctx.prev)
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: communityKeys.replies(postId) })
    },
  })
}
