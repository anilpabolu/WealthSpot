import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api'

// ── Types (responses are camelCased by the shared api client) ────────────────

export interface KnowledgeAsset {
  id: string
  assetType: 'image' | 'pdf' | 'video'
  url: string
  filename: string | null
  contentType: string | null
  sortOrder: number
}

export interface KnowledgeArticleSummary {
  id: string
  slug: string
  title: string
  synopsis: string
  coverImageUrl: string | null
  isPublished: boolean
  sortOrder: number
  imageCount: number
  pdfCount: number
  videoCount: number
}

export interface KnowledgeArticleDetail extends KnowledgeArticleSummary {
  body: string | null
  assets: KnowledgeAsset[]
}

export interface KnowledgeArticleInput {
  title: string
  synopsis: string
  body?: string | null
  coverImageUrl?: string | null
  isPublished?: boolean
  sortOrder?: number
}

// ── Public hooks ─────────────────────────────────────────────────────────────

export function useKnowledgeArticles() {
  return useQuery({
    queryKey: ['knowledge'],
    queryFn: () => apiGet<KnowledgeArticleSummary[]>('/knowledge'),
    staleTime: 30_000,
  })
}

export function useKnowledgeArticle(slug: string) {
  return useQuery({
    queryKey: ['knowledge', slug],
    queryFn: () => apiGet<KnowledgeArticleDetail>(`/knowledge/${slug}`),
    enabled: !!slug,
  })
}

// ── Admin hooks ──────────────────────────────────────────────────────────────

export function useAdminKnowledgeArticles() {
  return useQuery({
    queryKey: ['knowledge', 'admin'],
    queryFn: () => apiGet<KnowledgeArticleDetail[]>('/knowledge/admin/all'),
    staleTime: 10_000,
  })
}

function toPayload(input: Partial<KnowledgeArticleInput>) {
  return {
    ...(input.title !== undefined && { title: input.title }),
    ...(input.synopsis !== undefined && { synopsis: input.synopsis }),
    ...(input.body !== undefined && { body: input.body }),
    ...(input.coverImageUrl !== undefined && { cover_image_url: input.coverImageUrl }),
    ...(input.isPublished !== undefined && { is_published: input.isPublished }),
    ...(input.sortOrder !== undefined && { sort_order: input.sortOrder }),
  }
}

export function useCreateKnowledgeArticle() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Knowledge tile created' },
    mutationFn: (input: KnowledgeArticleInput) =>
      apiPost<KnowledgeArticleDetail>('/knowledge/admin', toPayload(input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })
}

export function useUpdateKnowledgeArticle() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Knowledge tile updated' },
    mutationFn: ({ id, ...input }: Partial<KnowledgeArticleInput> & { id: string }) =>
      apiPatch<KnowledgeArticleDetail>(`/knowledge/admin/${id}`, toPayload(input)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })
}

export function useDeleteKnowledgeArticle() {
  const qc = useQueryClient()
  return useMutation({
    meta: { successMessage: 'Knowledge tile deleted' },
    mutationFn: (id: string) => apiDelete(`/knowledge/admin/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })
}

export function useUploadKnowledgeAssets() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ articleId, files }: { articleId: string; files: File[] }) => {
      const formData = new FormData()
      files.forEach((f) => formData.append('files', f))
      const resp = await api.post<KnowledgeAsset[]>(
        `/knowledge/admin/${articleId}/assets`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 },
      )
      return resp.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })
}

export function useDeleteKnowledgeAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ articleId, assetId }: { articleId: string; assetId: string }) =>
      apiDelete(`/knowledge/admin/${articleId}/assets/${assetId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['knowledge'] }),
  })
}
