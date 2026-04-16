/**
 * useAppreciation – React Query hooks for appreciation events.
 * Mirrors web's useAppreciation.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

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

export function useAppreciationHistory(opportunityId: string | undefined) {
  return useQuery<AppreciationEvent[]>({
    queryKey: ['appreciation-history', opportunityId],
    queryFn: () => apiGet<AppreciationEvent[]>(`/opportunities/${opportunityId}/appreciation-history`),
    enabled: !!opportunityId,
    staleTime: 30_000,
  })
}
