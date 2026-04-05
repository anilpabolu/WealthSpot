import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface SiteContentItem {
  id: string
  page: string
  section_tag: string
  content_type: string
  value: string
  description: string | null
  is_active: boolean
}

/**
 * Fetch all active content for a page (public).
 */
export function useSiteContentByPage(page: string) {
  return useQuery({
    queryKey: ['site-content', page],
    queryFn: async () => {
      const resp = await api.get<SiteContentItem[]>(`/site-content/page/${page}`)
      return resp.data
    },
    staleTime: 60_000,
  })
}

/**
 * Hook for components to get a single content value with fallback.
 * Returns the dynamic CMS value or the provided fallback if not yet loaded.
 */
export function useContent(page: string, sectionTag: string, fallback: string): string {
  const { data } = useSiteContentByPage(page)
  const entry = data?.find((c) => c.section_tag === sectionTag)
  return entry?.value ?? fallback
}

/**
 * Admin: fetch ALL content entries (including inactive).
 */
export function useAllSiteContent() {
  return useQuery({
    queryKey: ['site-content-admin'],
    queryFn: async () => {
      const resp = await api.get<SiteContentItem[]>('/site-content/admin/all')
      return resp.data
    },
  })
}

/**
 * Admin: create content entry.
 */
export function useCreateSiteContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { page: string; section_tag: string; value: string; description?: string }) => {
      const resp = await api.post<SiteContentItem>('/site-content/admin', body)
      return resp.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-content-admin'] })
      qc.invalidateQueries({ queryKey: ['site-content'] })
    },
  })
}

/**
 * Admin: update content entry.
 */
export function useUpdateSiteContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string; value?: string; description?: string; is_active?: boolean }) => {
      const resp = await api.patch<SiteContentItem>(`/site-content/admin/${id}`, body)
      return resp.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-content-admin'] })
      qc.invalidateQueries({ queryKey: ['site-content'] })
    },
  })
}

/**
 * Admin: delete content entry.
 */
export function useDeleteSiteContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const resp = await api.delete(`/site-content/admin/${id}`)
      return resp.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['site-content-admin'] })
      qc.invalidateQueries({ queryKey: ['site-content'] })
    },
  })
}
