import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPost, apiGet } from '@/lib/api'

interface LikeResponse {
  liked: boolean
  likeCount: number
}

interface LikeStatus {
  liked: boolean
  likeCount: number
}

interface ShareResponse {
  message: string
  propertyReferralCode: string
  referralLink: string
}

interface ReferralCodeResponse {
  code: string
  referralLink: string
}

export interface UserActivityItem {
  id: string
  activityType: string
  resourceType: string
  resourceId: string
  resourceTitle: string
  resourceSlug: string | null
  createdAt: string
}

export function useLikeStatus(opportunityId: string) {
  return useQuery({
    queryKey: ['opportunity-like', opportunityId],
    queryFn: () => apiGet<LikeStatus>(`/opportunities/${opportunityId}/like-status`),
    enabled: !!opportunityId,
    staleTime: 10_000,
  })
}

export function useToggleLike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (opportunityId: string) =>
      apiPost<LikeResponse>(`/opportunities/${opportunityId}/like`),
    onMutate: async (opportunityId) => {
      await qc.cancelQueries({ queryKey: ['opportunity-like', opportunityId] })
      const prev = qc.getQueryData<LikeStatus>(['opportunity-like', opportunityId])
      if (prev) {
        qc.setQueryData<LikeStatus>(['opportunity-like', opportunityId], {
          liked: !prev.liked,
          likeCount: prev.liked ? prev.likeCount - 1 : prev.likeCount + 1,
        })
      }
      return { prev, opportunityId }
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        qc.setQueryData(['opportunity-like', context.opportunityId], context.prev)
      }
    },
    onSettled: (_data, _err, opportunityId) => {
      qc.invalidateQueries({ queryKey: ['opportunity-like', opportunityId] })
      qc.invalidateQueries({ queryKey: ['user-activities'] })
    },
  })
}

export function useTrackShare() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (opportunityId: string) =>
      apiPost<ShareResponse>(`/opportunities/${opportunityId}/share`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-activities'] })
    },
  })
}

export function usePropertyReferralCode(opportunityId: string) {
  return useQuery({
    queryKey: ['property-referral-code', opportunityId],
    queryFn: () => apiGet<ReferralCodeResponse>(`/opportunities/${opportunityId}/referral-code`),
    enabled: !!opportunityId,
    staleTime: Infinity, // static code, never changes
  })
}

export function useUserActivities(limit = 20) {
  return useQuery({
    queryKey: ['user-activities', limit],
    queryFn: () => apiGet<UserActivityItem[]>('/opportunities/user/activities', { params: { limit } }),
    staleTime: 15_000,
  })
}
