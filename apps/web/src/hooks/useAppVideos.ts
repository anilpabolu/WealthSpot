import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPatch, apiDelete, api } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────

export interface AppVideo {
  id: string
  page: string
  sectionTag: string
  title: string
  description: string | null
  videoUrl: string
  s3Key: string | null
  contentType: string | null
  sizeBytes: number | null
  thumbnailUrl: string | null
  additionalInfo: Record<string, unknown> | null
  isActive: boolean
  sortOrder: number
  uploadedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface AppVideoPublic {
  page: string
  sectionTag: string
  title: string
  description: string | null
  videoUrl: string
  thumbnailUrl: string | null
}

export interface PageOption {
  value: string
  label: string
}

export interface SectionOption {
  value: string
  label: string
}

export interface VideoPagesMeta {
  pages: PageOption[]
  sections: Record<string, SectionOption[]>
}

// ── Public hooks ────────────────────────────────────────────────────────────

/** Fetch all active videos (optionally filtered by page) */
export function usePublicVideos(page?: string) {
  return useQuery({
    queryKey: ['app-videos', 'public', page],
    queryFn: () =>
      apiGet<AppVideoPublic[]>('/app-videos/public', {
        params: page ? { page } : {},
      }),
  })
}

/** Fetch a single active video by page + section_tag */
export function usePublicVideo(page: string, sectionTag: string) {
  return useQuery({
    queryKey: ['app-videos', 'public', page, sectionTag],
    queryFn: () =>
      apiGet<AppVideoPublic>(`/app-videos/public/${page}/${sectionTag}`),
    enabled: !!page && !!sectionTag,
  })
}

// ── Admin hooks ─────────────────────────────────────────────────────────────

/** Get known pages & section tags for dropdowns */
export function useVideoPagesMeta() {
  return useQuery({
    queryKey: ['app-videos', 'pages-meta'],
    queryFn: () => apiGet<VideoPagesMeta>('/app-videos/pages'),
  })
}

/** List all videos (admin) */
export function useAdminVideos(page?: string) {
  return useQuery({
    queryKey: ['app-videos', 'admin', page],
    queryFn: () =>
      apiGet<AppVideo[]>('/app-videos/admin', {
        params: page ? { page } : {},
      }),
  })
}

/** Create a new video slot */
export function useCreateAppVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      page: string
      sectionTag: string
      title: string
      description?: string
      videoUrl: string
      thumbnailUrl?: string
      additionalInfo?: Record<string, unknown>
      isActive?: boolean
      sortOrder?: number
    }) =>
      apiPost<AppVideo>('/app-videos/admin', {
        page: payload.page,
        section_tag: payload.sectionTag,
        title: payload.title,
        description: payload.description,
        video_url: payload.videoUrl,
        thumbnail_url: payload.thumbnailUrl,
        additional_info: payload.additionalInfo,
        is_active: payload.isActive ?? true,
        sort_order: payload.sortOrder ?? 0,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-videos'] }),
  })
}

/** Update video metadata */
export function useUpdateAppVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      title?: string
      description?: string
      thumbnailUrl?: string
      additionalInfo?: Record<string, unknown>
      isActive?: boolean
      sortOrder?: number
    }) =>
      apiPatch<AppVideo>(`/app-videos/admin/${id}`, {
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.thumbnailUrl !== undefined && { thumbnail_url: payload.thumbnailUrl }),
        ...(payload.additionalInfo !== undefined && { additional_info: payload.additionalInfo }),
        ...(payload.isActive !== undefined && { is_active: payload.isActive }),
        ...(payload.sortOrder !== undefined && { sort_order: payload.sortOrder }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-videos'] }),
  })
}

/** Delete a video slot */
export function useDeleteAppVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/app-videos/admin/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-videos'] }),
  })
}

/** Upload/replace a video file */
export function useUploadAppVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await api.post<AppVideo>(
        `/app-videos/admin/${id}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return resp.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-videos'] }),
  })
}
