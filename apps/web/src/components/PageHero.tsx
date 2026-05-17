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
  /** Compact vertical rhythm for dense layouts */
  compact?: boolean
}

/**
 * Shared hero banner used across all authenticated app pages.
 * Gradient + blur orbs match VaultsPage exactly.
 */
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  onBack,
  children,
  contentClassName = 'max-w-3xl mx-auto px-4',
  compact = false,
}: PageHeroProps) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 35%, #4f46e5 70%, #6366f1 100%)' }}
    >
      {/* Blur orbs — match VaultsPage depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-violet-500/[0.08] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/[0.05] blur-3xl" />
      </div>

      <div className={`relative z-10 ${contentClassName} ${compact ? 'py-4 sm:py-5' : 'py-10 sm:py-14'}`}>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-white/50 hover:text-white/80 font-body text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {eyebrow && (
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37] mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-hero text-2xl sm:text-3xl font-bold text-white mb-2">{title}</h1>
        {subtitle && (
          <p className="font-body text-white/60 text-sm sm:text-base">{subtitle}</p>
        )}
        {children}
      </div>
    </div>
  )
}
