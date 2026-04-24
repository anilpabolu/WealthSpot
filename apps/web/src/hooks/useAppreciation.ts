import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'

export interface AppreciationEvent {
  id: string
  opportunityId: string
  createdBy: string | null
  creatorName: string | null
  mode: 'percentage' | 'absolute'
  inputValue: number
  oldValuation: number
  newValuation: number
  note: string | null
  createdAt: string
}

export interface AppreciationCreatePayload {
  mode: 'percentage' | 'absolute'
  value: number
  note?: string
}

export function useAppreciationHistory(opportunityId: string | undefined) {
  return useQuery<AppreciationEvent[]>({
    queryKey: ['appreciation-history', opportunityId],
    queryFn: () => apiGet<AppreciationEvent[]>(`/opportunities/${opportunityId}/appreciation-history`),
    enabled: !!opportunityId,
    staleTime: 30_000,
  })
}

export function useCreateAppreciation(opportunityId: string) {
  const qc = useQueryClient()
  return useMutation<AppreciationEvent, Error, AppreciationCreatePayload>({
    mutationFn: (payload) =>
      apiPost<AppreciationEvent>(`/opportunities/${opportunityId}/appreciate`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appreciation-history', opportunityId] })
      qc.invalidateQueries({ queryKey: ['opportunities'] })
      qc.invalidateQueries({ queryKey: ['opportunity'] })
      qc.invalidateQueries({ queryKey: ['portfolio'] })
      qc.invalidateQueries({ queryKey: ['vault-stats'] })
    },
  })
}

export function usePropertyAppreciation(propertyId: string) {
  const qc = useQueryClient()
  return useMutation<AppreciationEvent, Error, AppreciationCreatePayload>({
    mutationFn: (payload) =>
      apiPost<AppreciationEvent>(`/properties/${propertyId}/appreciate`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appreciation-history', propertyId] })
      qc.invalidateQueries({ queryKey: ['properties'] })
      qc.invalidateQueries({ queryKey: ['portfolio'] })
      qc.invalidateQueries({ queryKey: ['vault-stats'] })
    },
  })
}
