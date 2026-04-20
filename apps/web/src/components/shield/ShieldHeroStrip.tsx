import { useState } from 'react'
import { ShieldCheck, ChevronRight } from 'lucide-react'
import { ASSESSMENT_CATEGORIES, iconForCategory } from '@/lib/assessments'
import { ShieldDot } from './ShieldDot'
import { ShieldInfoModal } from './ShieldInfoModal'

/* eslint-disable react-hooks/static-components */
function LayerIcon({ iconName, className }: { iconName: string; className?: string }) {
  const Icon = iconForCategory(iconName)
  return <Icon size={12} strokeWidth={2.2} className={className} />
}
/* eslint-enable react-hooks/static-components */

/** Tailwind accent class → hex for CSS border */
function accentHex(accent: string): string {
  const map: Record<string, string> = {
    'text-emerald-500': '#10b981',
    'text-sky-500': '#0ea5e9',
    'text-amber-500': '#f59e0b',
    'text-fuchsia-500': '#d946ef',
    'text-blue-500': '#3b82f6',
    'text-rose-500': '#f43f5e',
    'text-violet-500': '#8b5cf6',
  }
  return map[accent] ?? '#6b7280'
}

/**
 * Creative staggered single-column Shield strip.
 * Odd rows accent-border left, even rows accent-border right.
 * Display-only — only "Learn more" link opens the info modal.
 */
export function ShieldHeroStrip() {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-full max-w-sm ml-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500">
            Shield Certified
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-0.5 transition-colors"
        >
          Learn more <ChevronRight size={10} />
        </button>
      </div>

      {/* Staggered layers */}
      <div className="space-y-[2px]">
        {ASSESSMENT_CATEGORIES.map((cat, idx) => {
          const isLeft = idx % 2 === 0
          return (
            <div
              key={cat.code}
              className={[
                'flex items-center gap-1.5 py-[3px] rounded-md',
                isLeft
                  ? 'border-l-2 pl-2 pr-1'
                  : 'border-r-2 pr-2 pl-1 flex-row-reverse',
              ].join(' ')}
              style={{ borderColor: accentHex(cat.accentColor) }}
            >
              {/* Icon badge */}
              <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.06]">
                <LayerIcon iconName={cat.icon} className={cat.accentColor} />
              </span>

              {/* Name + dot */}
              <span className="flex items-center gap-1">
                <span className="text-[10px] font-semibold text-theme-primary">
                  {cat.name.replace(' Assessment', '')}
                </span>
                <ShieldDot status="passed" size="sm" />
              </span>
            </div>
          )
        })}
      </div>

      <ShieldInfoModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}
