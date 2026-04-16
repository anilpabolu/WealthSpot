/**
 * useBuilderUpdates – React Query hooks for builder update feeds.
 * Mobile equivalent of apps/web/src/hooks/useBuilderUpdates.ts.
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

/* ── Types (camelCase, auto-converted from snake_case API) ──────── */

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
