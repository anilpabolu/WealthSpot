/**
 * WealthSpot Shield — web-side helpers.
 *
 * Re-exports the shared ASSESSMENT_CATEGORIES catalogue and maps the
 * `icon` string in each category to the matching lucide-react component.
 */

import {
  Building2,
  DoorOpen,
  Lock,
  MapPin,
  Scale,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export {
  ASSESSMENT_CATEGORIES,
  AssessmentStatus,
  countAssessmentSlots,
  findCategory,
  findSubItem,
} from '@wealthspot/types'
export type {
  AssessmentCategory,
  AssessmentCategoryCode,
  AssessmentCategoryRead,
  AssessmentDocumentRead,
  AssessmentOverallStatus,
  AssessmentSubItem,
  AssessmentSubItemRead,
  AssessmentSummaryRead,
  OpportunityRiskFlagRead,
  ShieldMetrics,
} from '@wealthspot/types'

const ICON_MAP: Record<string, LucideIcon> = {
  ShieldCheck,
  Scale,
  TrendingUp,
  MapPin,
  Building2,
  Lock,
  DoorOpen,
}

export function iconForCategory(iconName: string): LucideIcon {
  return ICON_MAP[iconName] ?? ShieldCheck
}

export const SHIELD_DOT_COLORS = {
  passed: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.7)]',
  in_progress: 'bg-sky-400',
  flagged: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.7)]',
  not_started: 'bg-slate-500/40',
  not_applicable: 'bg-slate-400/60',
} as const

export function dotColorForStatus(status: string): string {
  return (
    SHIELD_DOT_COLORS[status as keyof typeof SHIELD_DOT_COLORS] ??
    SHIELD_DOT_COLORS.not_started
  )
}

export function humanStatus(status: string): string {
  switch (status) {
    case 'passed':
      return 'Passed'
    case 'in_progress':
      return 'In progress'
    case 'flagged':
      return 'Flagged'
    case 'not_applicable':
      return 'Not applicable'
    default:
      return 'Not started'
  }
}

/**
 * Returns a three-state result label for a Shield sub-item status.
 * passed → PASS, flagged → FAIL, everything else → PENDING
 */
export function resultLabel(status: string): 'PASS' | 'PENDING' | 'FAIL' {
  if (status === 'passed') return 'PASS'
  if (status === 'flagged') return 'FAIL'
  return 'PENDING'
}

/**
 * Returns Tailwind class names for the three-state result badge.
 */
export function resultColor(status: string): string {
  if (status === 'passed')
    return 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700'
  if (status === 'flagged')
    return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700'
  return 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700'
}
