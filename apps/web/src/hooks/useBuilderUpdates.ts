import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost, apiPatch, apiDelete, api } from '@/lib/api'

/* ── Types ────────────────────────────────────────────────────────── */

export interface BuilderUpdateAttachment {
  id: string
  filename: string | null
  url: string
  contentType: string | null
  sizeBytes: number | null
  createdAt: string
}

export interface BuilderUpdateCreator {
  id: string
  fullName: string
  avatarUrl: string | null
}

export interface BuilderUpdate {
  id: string
  opportunityId: string
  creator: BuilderUpdateCreator | null
  title: string
  description: string | null
  attachments: BuilderUpdateAttachment[]
  createdAt: string
  updatedAt: string
}

/* ── Queries ──────────────────────────────────────────────────────── */

export function useBuilderUpdates(opportunityId: string | undefined) {
  return useQuery<BuilderUpdate[]>({
    queryKey: ['builder-updates', opportunityId],
    queryFn: () => apiGet(`/builder-updates/opportunities/${opportunityId}`),
    enabled: !!opportunityId,
  })
}

/* ── Mutations ────────────────────────────────────────────────────── */

export function useCreateBuilderUpdate(opportunityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { title: string; description?: string }) =>
      apiPost<BuilderUpdate>(`/builder-updates/opportunities/${opportunityId}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['builder-updates', opportunityId] }),
  })
}

export function usePatchBuilderUpdate(opportunityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; title?: string; description?: string }) =>
      apiPatch<BuilderUpdate>(`/builder-updates/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['builder-updates', opportunityId] }),
  })
}

export function useDeleteBuilderUpdate(opportunityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/builder-updates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['builder-updates', opportunityId] }),
  })
}

export function useUploadBuilderAttachment(opportunityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ updateId, file }: { updateId: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      const res = await api.post<BuilderUpdateAttachment>(
        `/builder-updates/${updateId}/attachments`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return res.data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['builder-updates', opportunityId] }),
  })
}

export function useDeleteBuilderAttachment(opportunityId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: string) =>
      apiDelete(`/builder-updates/attachments/${attachmentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['builder-updates', opportunityId] }),
  })
}
