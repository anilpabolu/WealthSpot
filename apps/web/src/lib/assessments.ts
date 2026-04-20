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
