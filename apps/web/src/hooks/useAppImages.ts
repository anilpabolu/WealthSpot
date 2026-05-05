import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────

export interface AppImage {
  id: string
  page: string
  sectionTag: string
  title: string
  description: string | null
  imageUrl: string
  s3Key: string | null
  contentType: string | null
  sizeBytes: number | null
  altText: string | null
  additionalInfo: Record<string, unknown> | null
  isActive: boolean
  sortOrder: number
  uploadedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface AppImagePublic {
  page: string
  sectionTag: string
  title: string
  description: string | null
  imageUrl: string
  altText: string | null
}

export interface PageOption {
  value: string
  label: string
}

export interface SectionOption {
  value: string
  label: string
}

export interface ImagePagesMeta {
  pages: PageOption[]
  sections: Record<string, SectionOption[]>
}

// ── Public hooks ────────────────────────────────────────────────────────────

/** Fetch all active images (optionally filtered by page). */
export function usePublicImages(page?: string) {
  return useQuery({
    queryKey: ['app-images', 'public', page],
    queryFn: () =>
      apiGet<AppImagePublic[]>('/app-images/public', {
        params: page ? { page } : {},
      }),
  })
}

/** Fetch a single active image by page + section tag. */
export function usePublicImage(page: string, sectionTag: string) {
  return useQuery({
    queryKey: ['app-images', 'public', page, sectionTag],
    queryFn: () => apiGet<AppImagePublic>(`/app-images/public/${page}/${sectionTag}`),
    enabled: !!page && !!sectionTag,
    retry: 1,
  })
}

// ── Admin hooks ─────────────────────────────────────────────────────────────

/** Get known pages & section tags for dropdowns. */
export function useImagePagesMeta() {
  return useQuery({
    queryKey: ['app-images', 'pages-meta'],
    queryFn: () => apiGet<ImagePagesMeta>('/app-images/pages'),
  })
}

/** List all images (admin). */
export function useAdminImages(page?: string) {
  return useQuery({
    queryKey: ['app-images', 'admin', page],
    queryFn: () =>
      apiGet<AppImage[]>('/app-images/admin', {
        params: page ? { page } : {},
      }),
  })
}

/** Create a new image slot. */
export function useCreateAppImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: {
      page: string
      sectionTag: string
      title: string
      description?: string
      imageUrl: string
      altText?: string
      additionalInfo?: Record<string, unknown>
      isActive?: boolean
      sortOrder?: number
    }) =>
      apiPost<AppImage>('/app-images/admin', {
        page: payload.page,
        section_tag: payload.sectionTag,
        title: payload.title,
        description: payload.description,
        image_url: payload.imageUrl,
        alt_text: payload.altText,
        additional_info: payload.additionalInfo,
        is_active: payload.isActive ?? true,
        sort_order: payload.sortOrder ?? 0,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-images'] }),
  })
}

/** Update image metadata. */
export function useUpdateAppImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string
      title?: string
      description?: string
      altText?: string
      additionalInfo?: Record<string, unknown>
      isActive?: boolean
      sortOrder?: number
    }) =>
      apiPatch<AppImage>(`/app-images/admin/${id}`, {
        ...(payload.title !== undefined && { title: payload.title }),
        ...(payload.description !== undefined && { description: payload.description }),
        ...(payload.altText !== undefined && { alt_text: payload.altText }),
        ...(payload.additionalInfo !== undefined && { additional_info: payload.additionalInfo }),
        ...(payload.isActive !== undefined && { is_active: payload.isActive }),
        ...(payload.sortOrder !== undefined && { sort_order: payload.sortOrder }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-images'] }),
  })
}

/** Delete an image slot. */
export function useDeleteAppImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/app-images/admin/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-images'] }),
  })
}

/** Upload/replace an image file. */
export function useUploadAppImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await api.post<AppImage>(`/app-images/admin/${id}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return resp.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['app-images'] }),
  })
}
