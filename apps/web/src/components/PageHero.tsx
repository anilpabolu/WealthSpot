import { type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'

interface PageHeroProps {
  /** Optional gold eyebrow label above the title, e.g. "WEALTHSPOT PLATFORM" */
  eyebrow?: string
  title: string
  subtitle?: string
  /** If provided, renders a Back button that calls this function */
  onBack?: () => void
  /** Additional content rendered below subtitle (e.g. step progress bars) */
  children?: ReactNode
  /** Override the inner content container className — default: max-w-3xl mx-auto px-4 */
  contentClassName?: string
  /**
   * Compact mode: slim strip matching VaultsPage height.
   * Non-compact: standard padding for wizard/form flows.
   */
  compact?: boolean
  /** Optional id attribute for navbar scroll detection */
  id?: string
  /**
   * If true, hero spans full viewport height (vault step wizard).
   * Content is pinned to the bottom.
   */
  fullHeight?: boolean
}

/**
 * Shared hero banner used across all authenticated app pages.
 * Always extends behind the transparent fixed navbar (-mt-16).
 */
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  onBack,
  children,
  contentClassName = 'max-w-3xl mx-auto px-4',
  compact = false,
  id,
  fullHeight = false,
}: PageHeroProps) {
  return (
    <div
      id={id}
      className={[
        'relative overflow-hidden -mt-16',
        fullHeight ? 'min-h-screen flex flex-col' : '',
      ].join(' ')}
      style={{ background: 'linear-gradient(135deg, #07101f 0%, #0f1b3a 50%, #07101f 100%)' }}
    >
      {/* Blur orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-32 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-32 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div
        className={[
          'relative z-10',
          contentClassName,
          fullHeight ? 'mt-auto' : '',
          // compact = slim strip; non-compact = more breathing room for wizard steps
          compact
            ? 'pt-[8.5rem] pb-14 lg:pb-16'
            : fullHeight
              ? 'pt-16 pb-8'
              : 'pt-[5.5rem] pb-6',
        ].join(' ')}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/50 hover:text-white/80 font-body text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {eyebrow && (
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37] mb-2">
            {eyebrow}
          </p>
        )}
        <h1 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight leading-[1.1]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-white/60 max-w-2xl text-base leading-relaxed font-body">
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
