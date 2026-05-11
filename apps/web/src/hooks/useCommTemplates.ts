import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiGet, apiPost } from '@/lib/api'

export interface CommTemplate {
  id: string
  name: string
  channel: string
  status: string
  created_at: string
  updated_at: string
}

export interface CommTemplateVersion {
  id: string
  template_id: string
  version_no: number
  locale: string
  subject: string | null
  body_text: string | null
  body_html: string | null
  status: string
  created_at: string
}

interface TemplateCreate {
  name: string
  channel: string
}

interface TemplateVersionCreate {
  locale?: string
  subject?: string | null
  body_mjml?: string | null
  body_html?: string | null
  body_text?: string | null
  variables?: Array<Record<string, unknown>>
}

export function useCommTemplates(channel?: string, skip = 0, limit = 50) {
  return useQuery({
    queryKey: ['comm', 'templates', channel, skip, limit],
    queryFn: () =>
      apiGet<CommTemplate[]>('/comm/templates', {
        params: { skip, limit, ...(channel && { channel }) },
      }),
    staleTime: 30_000,
  })
}

export function useCreateCommTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TemplateCreate) => apiPost<CommTemplate>('/comm/templates', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'templates'] }),
    meta: { successMessage: 'Template created', errorTitle: 'Failed to create template' },
  })
}

export function useAddTemplateVersion(templateId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: TemplateVersionCreate) =>
      apiPost<CommTemplateVersion>(`/comm/templates/${templateId}/versions`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comm', 'templates'] }),
    meta: { successMessage: 'Version saved', errorTitle: 'Failed to save version' },
  })
}
