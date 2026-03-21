/**
 * useUpload – media-upload hooks adapted for React Native.
 * Uses FormData compatible with expo-image-picker results.
 */

import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'

export interface UploadedMedia {
  id: string
  mediaType: string
  url: string
  filename: string
  sizeBytes: number
  isCover: boolean
}

/**
 * Upload opportunity media files (images / documents).
 * `uri` should come from expo-image-picker or expo-document-picker.
 */
export function useUploadOpportunityMedia() {
  return useMutation({
    mutationFn: async ({
      opportunityId,
      assets,
      isCover = false,
    }: {
      opportunityId: string
      assets: Array<{ uri: string; fileName?: string; mimeType?: string }>
      isCover?: boolean
    }) => {
      const formData = new FormData()
      for (const asset of assets) {
        formData.append('files', {
          uri: asset.uri,
          name: asset.fileName ?? 'upload.jpg',
          type: asset.mimeType ?? 'image/jpeg',
        } as any)
      }
      const resp = await api.post<UploadedMedia[]>(
        `/uploads/opportunity/${opportunityId}/media?is_cover=${isCover}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return resp.data
    },
  })
}

/**
 * Upload a company logo image.
 */
export function useUploadCompanyLogo() {
  return useMutation({
    mutationFn: async ({
      companyId,
      asset,
    }: {
      companyId: string
      asset: { uri: string; fileName?: string; mimeType?: string }
    }) => {
      const formData = new FormData()
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName ?? 'logo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as any)
      const resp = await api.post<{ url: string }>(
        `/uploads/company/${companyId}/logo`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      return resp.data
    },
  })
}
