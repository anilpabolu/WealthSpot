/**
 * web useProfileCompletion hook tests – pure logic (unit)
 * Tests the mapping from /profile/completion API response to ProfileField[].
 */
import { describe, expect, it } from 'vitest'

// Mirror the pure logic from useProfileCompletion.ts
type CompletionStatus = {
  profileCompletionPct: number
  sections: Record<string, boolean>
  emailVerified: boolean
  phoneVerified: boolean
  referralCode: string | null
  isComplete: boolean
}

const sectionLabels: Record<string, string> = {
  personal_risk: 'Personal & Risk',
  interests: 'Interests',
  skills: 'Skills & Availability',
  address: 'Address',
  verification: 'Verification',
}

function mapCompletion(completion: CompletionStatus | undefined, isLoading = false) {
  if (!completion) return { percentage: 0, fields: [], isComplete: false, isLoading }

  const fields = Object.entries(completion.sections).map(([key, done]) => ({
    key,
    label: sectionLabels[key] ?? key,
    section: sectionLabels[key] ?? key,
    completed: done,
  }))

  return {
    percentage: completion.profileCompletionPct,
    fields,
    isComplete: completion.isComplete,
    isLoading,
  }
}

describe('web useProfileCompletion logic', () => {
  it('returns 0% and empty fields when completion status is undefined', () => {
    const result = mapCompletion(undefined)
    expect(result.percentage).toBe(0)
    expect(result.fields).toHaveLength(0)
    expect(result.isComplete).toBe(false)
  })

  it('maps all sections to fields with human-readable labels', () => {
    const result = mapCompletion({
      profileCompletionPct: 60,
      sections: {
        personal_risk: true,
        interests: true,
        skills: false,
        address: false,
        verification: false,
      },
      emailVerified: true,
      phoneVerified: false,
      referralCode: null,
      isComplete: false,
    })

    expect(result.percentage).toBe(60)
    expect(result.fields).toHaveLength(5)

    const personalField = result.fields.find((f) => f.key === 'personal_risk')
    expect(personalField?.label).toBe('Personal & Risk')
    expect(personalField?.completed).toBe(true)

    const skillsField = result.fields.find((f) => f.key === 'skills')
    expect(skillsField?.label).toBe('Skills & Availability')
    expect(skillsField?.completed).toBe(false)
  })

  it('returns isComplete=true when all sections are done', () => {
    const result = mapCompletion({
      profileCompletionPct: 100,
      sections: {
        personal_risk: true,
        interests: true,
        skills: true,
        address: true,
        verification: true,
      },
      emailVerified: true,
      phoneVerified: true,
      referralCode: 'ALICE10',
      isComplete: true,
    })

    expect(result.percentage).toBe(100)
    expect(result.isComplete).toBe(true)
    expect(result.fields.every((f) => f.completed)).toBe(true)
  })

  it('propagates isLoading=true when data is pending', () => {
    const result = mapCompletion(undefined, true)
    expect(result.isLoading).toBe(true)
    expect(result.percentage).toBe(0)
  })
})
