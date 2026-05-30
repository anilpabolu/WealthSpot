import { useMutation } from '@tanstack/react-query'
import { API_BASE_URL } from '@/lib/constants'

export interface UploadedMedia {
  id: string
  mediaType: string
  url: string
  filename: string
  sizeBytes: number
  isCover: boolean
}

export function useUploadOpportunityMedia() {
  return useMutation({
    mutationFn: async ({
      opportunityId,
      files,
      isCover = false,
    }: {
      opportunityId: string
      files: File[]
      isCover?: boolean
    }) => {
      const formData = new FormData()
      files.forEach((f) => formData.append('files', f))
      const token = localStorage.getItem('ws_token')
      
      const resp = await fetch(`${API_BASE_URL}/uploads/opportunity/${opportunityId}/media?is_cover=${isCover}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (!resp.ok) {
        throw new Error(`Upload failed: ${resp.status}`)
      }
      return resp.json() as Promise<UploadedMedia[]>
    },
    onError: (error: Error) => {
      console.error('[upload] Media upload failed:', error.message)
    },
  })
}

export function useUploadCompanyLogo() {
  return useMutation({
    mutationFn: async ({ companyId, file }: { companyId: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const token = localStorage.getItem('ws_token')

      const resp = await fetch(`${API_BASE_URL}/uploads/company/${companyId}/logo`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (!resp.ok) {
        throw new Error(`Upload failed: ${resp.status}`)
      }
      return resp.json() as Promise<{ url: string }>
    },
    onError: (error: Error) => {
      console.error('[upload] Logo upload failed:', error.message)
    },
  })
}
