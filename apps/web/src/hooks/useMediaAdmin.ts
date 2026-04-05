import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface MediaItem {
  id: string
  media_type: string
  url: string
  filename: string
  size_bytes: number
  is_cover: boolean
  sort_order: number
}

export function useListOpportunityMedia(opportunityId: string | undefined) {
  return useQuery({
    queryKey: ['admin-media', opportunityId],
    queryFn: async () => {
      const resp = await api.get<MediaItem[]>(`/uploads/admin/opportunity/${opportunityId}/media`)
      return resp.data
    },
    enabled: !!opportunityId,
  })
}

export function useAdminUploadMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      opportunityId,
      files,
      isCover = false,
    }: {
      opportunityId: string
      files: File[]
      isCover?: boolean
    }) => {
      const formData = new FormData()
      files.forEach((f) => formData.append('files', f))
      const resp = await api.post<MediaItem[]>(
        `/uploads/admin/opportunity/${opportunityId}/media?is_cover=${isCover}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return resp.data
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-media', vars.opportunityId] })
    },
  })
}

export function useDeleteMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const resp = await api.delete<{ deleted: boolean }>(`/uploads/opportunity-media/${mediaId}`)
      return resp.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-media'] })
    },
  })
}

export function useUpdateMedia() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      mediaId,
      isCover,
      sortOrder,
    }: {
      mediaId: string
      isCover?: boolean
      sortOrder?: number
    }) => {
      const params = new URLSearchParams()
      if (isCover !== undefined) params.set('is_cover', String(isCover))
      if (sortOrder !== undefined) params.set('sort_order', String(sortOrder))
      const resp = await api.patch<MediaItem>(`/uploads/opportunity-media/${mediaId}?${params}`)
      return resp.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-media'] })
    },
  })
}
