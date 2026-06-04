/**
 * React Query hooks for source click tracking (visit counters).
 *
 * useSourceClicks()          — bulk-fetch all click counts
 * useIncrementSourceClick()  — POST to increment + optimistic cache update
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'

interface SourceClickItem {
  sourceType: string
  sourceId: string
  clickCount: number
}

interface SourceClickBulkResponse {
  items: SourceClickItem[]
}

/**
 * Fetch all source click counts in one call.
 * Returns a Map<string, number> keyed by "sourceType:sourceId" for easy lookup.
 */
export function useSourceClicks() {
  return useQuery({
    queryKey: ['source-clicks'],
    queryFn: async () => {
      const data = await apiGet<SourceClickBulkResponse>('/source-clicks')
      const map = new Map<string, number>()
      for (const item of data.items) {
        map.set(`${item.sourceType}:${item.sourceId}`, item.clickCount)
      }
      return map
    },
    staleTime: 30_000,
  })
}

/**
 * Helper to look up a count from the source-clicks map.
 */
export function getSourceClickCount(
  map: Map<string, number> | undefined,
  sourceType: string,
  sourceId: string,
): number {
  return map?.get(`${sourceType}:${sourceId}`) ?? 0
}

/**
 * Mutation: increment click count and optimistically update cache.
 */
export function useIncrementSourceClick() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sourceType, sourceId }: { sourceType: string; sourceId: string }) =>
      apiPost<SourceClickItem>(`/source-clicks/${sourceType}/${sourceId}`, {}),
    onMutate: async ({ sourceType, sourceId }) => {
      // Cancel outgoing fetches so they don't overwrite the optimistic update
      await qc.cancelQueries({ queryKey: ['source-clicks'] })

      // Snapshot current state for rollback
      const prev = qc.getQueryData<Map<string, number>>(['source-clicks'])

      // Optimistically update the count in cache
      if (prev) {
        const next = new Map(prev)
        const key = `${sourceType}:${sourceId}`
        next.set(key, (next.get(key) ?? 0) + 1)
        qc.setQueryData(['source-clicks'], next)
      }

      return { prev }
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.prev) {
        qc.setQueryData(['source-clicks'], context.prev)
      }
    },
    onSettled: () => {
      // Refetch to sync with server truth
      qc.invalidateQueries({ queryKey: ['source-clicks'] })
    },
  })
}
