import {
  ASSESSMENT_CATEGORIES,
  type AssessmentCategoryCode,
  iconForCategory,
} from '@/lib/assessments'
import { ShieldDot } from './ShieldDot'

interface ShieldTileProps {
  code: AssessmentCategoryCode
  status?: string
  onClick?: () => void
  compact?: boolean
}

/** Standalone component to resolve icon from name — avoids creating component during render */
/* eslint-disable react-hooks/static-components -- iconForCategory is a static O(1) map lookup returning a stable LucideIcon reference, not a component factory */
function ShieldTileIcon({ iconName, size }: { iconName: string; size: number }) {
  const Icon = iconForCategory(iconName)
  return <Icon size={size} strokeWidth={2.2} />
}
/* eslint-enable react-hooks/static-components */

/**
 * One of the seven hero tiles. Carries the icon, category name,
 * one-line definition and the current status dot.
 */
export function ShieldTile({
  code,
  status = 'not_started',
  onClick,
  compact = false,
}: ShieldTileProps) {
  const cat = ASSESSMENT_CATEGORIES.find((c) => c.code === code)
  if (!cat) return null
  const iconName = cat.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'group flex items-start gap-3 rounded-xl border border-theme bg-theme-card px-3 py-2.5 text-left transition',
        'hover:border-primary/60 hover:-translate-y-0.5 hover:shadow-lg',
        compact ? 'min-h-[60px]' : 'min-h-[78px]',
      ].join(' ')}
    >
      <span className={['mt-0.5', cat.accentColor].join(' ')}>
        <ShieldTileIcon iconName={iconName} size={compact ? 18 : 20} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-theme-primary truncate">
            {cat.name.replace(' Assessment', '')}
          </span>
          <ShieldDot status={status} size="sm" pulse />
        </span>
        {!compact && (
          <span className="block text-[11px] text-theme-secondary leading-snug mt-0.5 line-clamp-2">
            {cat.heroShortDef}
          </span>
        )}
      </span>
    </button>
  )
}
