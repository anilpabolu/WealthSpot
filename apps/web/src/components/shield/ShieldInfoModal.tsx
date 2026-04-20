import { X, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { ASSESSMENT_CATEGORIES, iconForCategory } from '@/lib/assessments'

interface ShieldInfoModalProps {
  open: boolean
  onClose: () => void
  initialCategory?: string
}

/** Tailwind accent class → hex */
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
 * Infographic-style modal — alternating left/right cards with
 * accent side-borders, numbered badges, sub-item chips, and
 * connector lines between layers.
 */
export function ShieldInfoModal({ open, onClose, initialCategory }: ShieldInfoModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-[var(--bg-surface)] border border-theme shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-900/90 via-indigo-900/90 to-emerald-900/90 backdrop-blur-md px-6 py-5 rounded-t-2xl border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <ShieldCheck size={18} className="text-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                  WealthSpot Shield
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">
                7 layers of trust between you &amp; every deal
              </h2>
              <p className="text-sm text-white/60 mt-1 leading-relaxed">
                Every opportunity passes through a rigorous 7-category review.
                A listing earns{' '}
                <span className="text-emerald-400 font-semibold">Shield Certified</span>{' '}
                status only when every checkpoint is green.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/50 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Infographic timeline */}
        <div className="px-6 py-5 space-y-4">
          {ASSESSMENT_CATEGORIES.map((cat, idx) => {
            const Icon = iconForCategory(cat.icon)
            const isLeft = idx % 2 === 0
            const highlight = initialCategory === cat.code
            const hex = accentHex(cat.accentColor)

            return (
              <div key={cat.code} className="relative">
                <div
                  className={[
                    'relative rounded-xl p-4 transition-all',
                    'bg-theme-card/50 hover:bg-theme-card/80',
                    highlight ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-surface)]' : '',
                    isLeft
                      ? 'border-l-[3px] border-r-0 ml-0 mr-8'
                      : 'border-r-[3px] border-l-0 mr-0 ml-8',
                  ].join(' ')}
                  style={{
                    borderColor: hex,
                    ...(highlight ? { ['--tw-ring-color' as string]: hex } : {}),
                  }}
                >
                  {/* Layer number badge */}
                  <span
                    className={[
                      'absolute -top-2.5 w-5 h-5 rounded-full flex items-center justify-center',
                      'text-[10px] font-bold text-white',
                      isLeft ? 'left-3' : 'right-3',
                    ].join(' ')}
                    style={{ backgroundColor: hex }}
                  >
                    {idx + 1}
                  </span>

                  {/* Title row */}
                  <div className={['flex items-center gap-2.5 mt-1', isLeft ? '' : 'flex-row-reverse'].join(' ')}>
                    <span
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${hex}18` }}
                    >
                      <Icon size={18} className={cat.accentColor} />
                    </span>
                    <div className={['flex-1', isLeft ? '' : 'text-right'].join(' ')}>
                      <div className="text-sm font-bold text-theme-primary">{cat.name}</div>
                      <div className="text-[10px] uppercase tracking-wider text-theme-tertiary/70">
                        Verified by{' '}
                        {cat.performedBy === 'law_firm'
                          ? 'Empanelled Law Firm'
                          : cat.performedBy === 'sme'
                            ? 'Independent SME Panel'
                            : 'WealthSpot Team'}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={['text-xs text-theme-secondary leading-relaxed mt-2.5', isLeft ? '' : 'text-right'].join(' ')}>
                    {cat.fullDescription}
                  </p>

                  {/* Sub-item chips */}
                  <div className={['flex flex-wrap gap-1.5 mt-3', isLeft ? '' : 'justify-end'].join(' ')}>
                    {cat.subItems.map((s) => (
                      <span
                        key={s.code}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-theme-secondary/80 border border-white/[0.06]"
                      >
                        <CheckCircle2 size={9} style={{ color: hex }} />
                        {s.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Connector line */}
                {idx < ASSESSMENT_CATEGORIES.length - 1 && (
                  <div
                    className={['absolute -bottom-4 w-px h-4', isLeft ? 'left-6' : 'right-6'].join(' ')}
                    style={{ background: `linear-gradient(to bottom, ${hex}40, transparent)` }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-theme text-center">
          <p className="text-xs text-theme-secondary/60">
            All assessments are refreshed quarterly. Documents are independently verified.
          </p>
        </div>
      </div>
    </div>
  )
}
