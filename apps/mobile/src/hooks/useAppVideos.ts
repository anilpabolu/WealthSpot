/**
 * useAppVideos – App-wide video management hooks for mobile.
 * Mirrors web's useAppVideos.ts (public hooks only).
 */

import { useQuery } from '@tanstack/react-query'
import { apiGet } from '../lib/api'

export interface AppVideoPublic {
  page: string
  sectionTag: string
  title: string
  description: string | null
  videoUrl: string
  thumbnailUrl: string | null
}

/** Fetch all active videos (optionally filtered by page) */
export function usePublicVideos(page?: string) {
  return useQuery({
    queryKey: ['app-videos', 'public', page],
    queryFn: () =>
      apiGet<AppVideoPublic[]>('/app-videos/public', {
        params: page ? { page } : {},
      }),
    staleTime: 120_000,
  })
}

/** Fetch a single active video by page + section_tag */
export function usePublicVideo(page: string, sectionTag: string) {
  return useQuery({
    queryKey: ['app-videos', 'public', page, sectionTag],
    queryFn: () =>
      apiGet<AppVideoPublic>(`/app-videos/public/${page}/${sectionTag}`),
    enabled: !!page && !!sectionTag,
    staleTime: 120_000,
  })
}
