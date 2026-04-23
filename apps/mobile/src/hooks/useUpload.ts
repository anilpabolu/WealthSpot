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

export interface ReactNativeFile {
  uri: string
  name: string
  type: string
}

export function useUploadOpportunityMedia() {
  return useMutation({
    mutationFn: async ({
      opportunityId,
      files,
      isCover = false,
    }: {
      opportunityId: string
      files: ReactNativeFile[]
      isCover?: boolean
    }) => {
      const formData = new FormData()
      files.forEach((f) => formData.append('files', f as any))
      const resp = await api.post<UploadedMedia[]>(
        `/uploads/opportunity/${opportunityId}/media?is_cover=${isCover}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return resp.data
    },
    onError: (error: Error) => {
      console.error('[upload] Media upload failed:', error.message)
    },
  })
}

export function useUploadCompanyLogo() {
  return useMutation({
    mutationFn: async ({ companyId, file }: { companyId: string; file: ReactNativeFile }) => {
      const formData = new FormData()
      formData.append('file', file as any)
      const resp = await api.post<{ url: string }>(
        `/uploads/company/${companyId}/logo`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return resp.data
    },
    onError: (error: Error) => {
      console.error('[upload] Logo upload failed:', error.message)
    },
  })
}
