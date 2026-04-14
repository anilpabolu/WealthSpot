import { useQuery } from '@tanstack/react-query'
import { apiGet } from '@/lib/api'

interface SiteContentItem {
  id: string
  page: string
  sectionTag: string
  contentType: string
  value: string
  description: string | null
  isActive: boolean
}

/**
 * Fetch all active content for a page (public).
 */
export function useSiteContentByPage(page: string) {
  return useQuery({
    queryKey: ['site-content', page],
    queryFn: () => apiGet<SiteContentItem[]>(`/site-content/page/${page}`),
    staleTime: 60_000,
  })
}

/**
 * Hook for components to get a single content value with fallback.
 * Returns the dynamic CMS value or the provided fallback if not yet loaded.
 */
export function useContent(page: string, sectionTag: string, fallback: string): string {
  const { data } = useSiteContentByPage(page)
  const entry = data?.find((c) => c.sectionTag === sectionTag)
  return entry?.value ?? fallback
}
