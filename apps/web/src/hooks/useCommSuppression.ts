import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiDelete, apiGet, apiPost } from '@/lib/api'

export interface CommSuppressionEntry {
  channel: string
  identifier: string
  reason: string
  note: string | null
  added_at: string
}

interface SuppressionCreate {
  channel: string
  identifier: string
  reason: string
  note?: string | null
}

export function useCommSuppression(channel?: string, skip = 0, limit = 50) {
  return useQuery({
    queryKey: ['comm', 'suppression', channel, skip, limit],
    queryFn: () =>
      apiGet<CommSuppressionEntry[]>('/comm/suppression', {
        params: { skip, limit, ...(channel && { channel }) },
      }),
    staleTime: 30_000,
  })
}

export function useCreateCommSuppression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SuppressionCreate) =>
      apiPost<CommSuppressionEntry>('/comm/suppression', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'suppression'] }),
    meta: { successMessage: 'Address suppressed', errorTitle: 'Failed to add suppression' },
  })
}

export function useDeleteCommSuppression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ channel, identifier }: { channel: string; identifier: string }) =>
      apiDelete(`/comm/suppression/${channel}/${encodeURIComponent(identifier)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'suppression'] }),
    meta: { successMessage: 'Suppression removed', errorTitle: 'Failed to remove suppression' },
  })
}
