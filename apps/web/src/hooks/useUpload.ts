import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'

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
      const resp = await api.post<UploadedMedia[]>(
        `/uploads/opportunity/${opportunityId}/media?is_cover=${isCover}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } } as any,
      )
      return resp.data
    },
  })
}

export function useUploadCompanyLogo() {
  return useMutation({
    mutationFn: async ({ companyId, file }: { companyId: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await api.post<{ url: string }>(
        `/uploads/company/${companyId}/logo`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } } as any,
      )
      return resp.data
    },
  })
}
