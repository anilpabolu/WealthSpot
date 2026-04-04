/**
 * mobile useProfileCompletion hook tests – pure logic (unit)
 * Tests the percentage calculation and field-checking logic.
 */
import { describe, expect, it } from 'vitest'

// Pure logic extracted from useProfileCompletion.ts – we test the logic directly
// without rendering hooks (no DOM/React renderer available in unit env).

type ProfileMock = {
  fullName?: string
  phone?: string
  avatarUrl?: string
  kycStatus: string
  referralCode?: string
  kycDocuments: Array<{ documentType: string; verificationStatus: string }>
}

function checkFields(profile: ProfileMock | undefined) {
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
    { key: 'fullName', completed: !!profile.fullName?.trim() },
    { key: 'phone', completed: !!profile.phone?.trim() },
    { key: 'avatarUrl', completed: !!profile.avatarUrl },
    { key: 'kycStatus', completed: profile.kycStatus === 'APPROVED' },
    { key: 'panDoc', completed: !!hasPanDoc },
    { key: 'aadhaarDoc', completed: !!hasAadhaarDoc },
    { key: 'selfieDoc', completed: !!hasSelfieDoc },
    { key: 'referralCode', completed: !!profile.referralCode },
  ]
}

function calcCompletion(profile: ProfileMock | undefined) {
  const fields = checkFields(profile)
  const completedCount = fields.filter((f) => f.completed).length
  const percentage = fields.length > 0 ? Math.round((completedCount / fields.length) * 100) : 0
  return { percentage, fields, isComplete: percentage === 100 }
}

describe('useProfileCompletion logic', () => {
  it('returns 0% for a brand-new user with no data', () => {
    const result = calcCompletion({ kycStatus: 'NOT_STARTED', kycDocuments: [] })
    expect(result.percentage).toBe(0)
    expect(result.isComplete).toBe(false)
  })

  it('returns 100% for a fully verified profile', () => {
    const result = calcCompletion({
      fullName: 'Alice Smith',
      phone: '+91 98765 43210',
      avatarUrl: 'https://cdn.example.com/avatar.jpg',
      kycStatus: 'APPROVED',
      referralCode: 'ALICE10',
      kycDocuments: [
        { documentType: 'PAN', verificationStatus: 'VERIFIED' },
        { documentType: 'AADHAAR', verificationStatus: 'VERIFIED' },
        { documentType: 'SELFIE', verificationStatus: 'VERIFIED' },
      ],
    })
    expect(result.percentage).toBe(100)
    expect(result.isComplete).toBe(true)
  })

  it('does not count REJECTED documents as uploaded', () => {
    const result = calcCompletion({
      fullName: 'Bob',
      phone: '+91 11111 11111',
      avatarUrl: undefined,
      kycStatus: 'REJECTED',
      referralCode: undefined,
      kycDocuments: [
        { documentType: 'PAN', verificationStatus: 'REJECTED' },
      ],
    })
    const panField = result.fields.find((f) => f.key === 'panDoc')
    expect(panField?.completed).toBe(false)
  })

  it('includes PENDING documents as uploaded', () => {
    const result = calcCompletion({
      kycStatus: 'PENDING',
      kycDocuments: [{ documentType: 'PAN', verificationStatus: 'PENDING' }],
    })
    const panField = result.fields.find((f) => f.key === 'panDoc')
    expect(panField?.completed).toBe(true)
  })

  it('returns empty fields when profile is undefined', () => {
    const result = calcCompletion(undefined)
    expect(result.percentage).toBe(0)
    expect(result.fields).toHaveLength(0)
  })
})
