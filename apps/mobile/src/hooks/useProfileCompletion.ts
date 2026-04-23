import { useMemo } from 'react'
import { useProfileCompletionStatus } from './useProfileAPI'

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

/**
 * Wraps the new /profile/completion API and also provides the legacy fields shape
 * so existing consumers don't break.
 */
export function useProfileCompletion(): ProfileCompletionResult {
  const { data: completion, isLoading } = useProfileCompletionStatus()

  return useMemo(() => {
    if (!completion) {
      return { percentage: 0, fields: [], isComplete: false, isLoading }
    }

    const sectionLabels: Record<string, string> = {
      personal: 'Personal Info',
      interests: 'Interests',
      address: 'Address',
      verification: 'Verification',
    }

    const fields: ProfileField[] = Object.entries(completion.sections).map(([key, done]) => ({
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
  }, [completion, isLoading])
}
