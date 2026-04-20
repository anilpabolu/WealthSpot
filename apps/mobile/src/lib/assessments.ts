/**
 * Mobile-side Shield helpers — mirrors apps/web/src/lib/assessments.ts.
 *
 * Re-exports the shared ASSESSMENT_CATEGORIES catalogue and maps the
 * `icon` string to the lucide-react-native component.
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
} from 'lucide-react-native'

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

export function dotColorForStatus(status: string): string {
  switch (status) {
    case 'passed':
      return '#10b981'
    case 'flagged':
      return '#f59e0b'
    case 'in_progress':
      return '#38bdf8'
    case 'not_applicable':
      return '#94a3b8'
    default:
      return '#64748b'
  }
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
