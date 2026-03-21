/**
 * useProfileCompletion – derived profile completion percentage.
 * Mirrors web's useProfileCompletion.ts.
 */

import { useMemo } from 'react'
import { useUserProfile, type UserProfile } from './useUserProfile'

export interface ProfileField {
  key: string
  label: string
  section: string
  completed: boolean
}

export interface ProfileCompletionResult {
  percentage: number
  fields: ProfileField[]
  isComplete: boolean
  isLoading: boolean
}

function checkFields(profile: UserProfile | undefined): ProfileField[] {
  if (!profile) return []

  const hasPanDoc = profile.kycDocuments?.some(
    (d) => d.documentType === 'PAN' && d.verificationStatus !== 'REJECTED',
  )
  const hasAadhaarDoc = profile.kycDocuments?.some(
    (d) => d.documentType === 'AADHAAR' && d.verificationStatus !== 'REJECTED',
  )
  const hasSelfieDoc = profile.kycDocuments?.some(
    (d) => d.documentType === 'SELFIE' && d.verificationStatus !== 'REJECTED',
  )

  return [
    { key: 'fullName', label: 'Full Name', section: 'Personal Info', completed: !!profile.fullName?.trim() },
    { key: 'phone', label: 'Phone Number', section: 'Personal Info', completed: !!profile.phone?.trim() },
    { key: 'avatarUrl', label: 'Profile Photo', section: 'Personal Info', completed: !!profile.avatarUrl },
    { key: 'kycStatus', label: 'KYC Verification', section: 'KYC Verification', completed: profile.kycStatus === 'APPROVED' },
    { key: 'panDoc', label: 'PAN Card', section: 'KYC Verification', completed: !!hasPanDoc },
    { key: 'aadhaarDoc', label: 'Aadhaar Card', section: 'KYC Verification', completed: !!hasAadhaarDoc },
    { key: 'selfieDoc', label: 'Selfie Verification', section: 'KYC Verification', completed: !!hasSelfieDoc },
    { key: 'referralCode', label: 'Referral Code', section: 'Account', completed: !!profile.referralCode },
  ]
}

export function useProfileCompletion(): ProfileCompletionResult {
  const { data: profile, isLoading } = useUserProfile()

  return useMemo(() => {
    const fields = checkFields(profile)
    const completedCount = fields.filter((f) => f.completed).length
    const percentage = fields.length > 0 ? Math.round((completedCount / fields.length) * 100) : 0

    return {
      percentage,
      fields,
      isComplete: percentage === 100,
      isLoading,
    }
  }, [profile, isLoading])
}
