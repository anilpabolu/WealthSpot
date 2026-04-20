import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ShieldCheck, ChevronRight, CheckCircle2 } from 'lucide-react'
import { ASSESSMENT_CATEGORIES, iconForCategory } from '@/lib/assessments'
import { illustrationForCategory } from './shieldIllustrationMap.ts'
import { ShieldInfoModal } from './ShieldInfoModal'

/** Pre-computed at module level so component refs are stable (satisfies React compiler). */
const CATEGORY_ICONS = ASSESSMENT_CATEGORIES.map((c) => iconForCategory(c.icon))
const CATEGORY_ILLUSTRATIONS = ASSESSMENT_CATEGORIES.map((c) => illustrationForCategory(c.code))

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

const INTERVAL_MS = 5000

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 280 : -280,
    opacity: 0,
    scale: 0.92,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -280 : 280,
    opacity: 0,
    scale: 0.92,
  }),
}

/**
 * Auto-rotating carousel that shows one Shield assessment layer at a time
 * with an anime/cartoon SVG illustration, elaborated descriptions, and
 * interactive dot indicators.
 */
export function ShieldHeroCarousel() {
  const [[activeIndex, direction], setActive] = useState<[number, number]>([0, 1])
  const [modalOpen, setModalOpen] = useState(false)
  const [paused, setPaused] = useState(false)

  const goTo = useCallback((idx: number) => {
    setActive(([prev]) => [idx, idx > prev ? 1 : -1])
  }, [])

  const advance = useCallback(() => {
    setActive(([prev]) => [(prev + 1) % ASSESSMENT_CATEGORIES.length, 1])
  }, [])

  // Auto-advance timer
  useEffect(() => {
    if (paused) return
    const id = setInterval(advance, INTERVAL_MS)
    return () => clearInterval(id)
  }, [advance, paused])

  const cat = ASSESSMENT_CATEGORIES[activeIndex]!
  const Icon = CATEGORY_ICONS[activeIndex]!
  const Illustration = CATEGORY_ILLUSTRATIONS[activeIndex]!
  const hex = accentHex(cat.accentColor)

  return (
    <div
      className="relative w-full h-full flex flex-col justify-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
            Shield Certified
          </span>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="text-xs text-white/50 hover:text-white flex items-center gap-0.5 transition-colors"
        >
          Learn more <ChevronRight size={12} />
        </button>
      </div>

      {/* Carousel card area */}
      <div className="relative overflow-hidden min-h-[220px] sm:min-h-[240px]">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={cat.code}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.8 }}
            className="absolute inset-0"
          >
            <div className="flex gap-5 items-start">
              {/* Illustration (left side of card) */}
              <div className="flex-shrink-0 w-[100px] h-[100px] sm:w-[120px] sm:h-[120px]">
                <motion.div
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                  className="w-full h-full"
                >
                  <Illustration className="w-full h-full drop-shadow-lg" />
                </motion.div>
              </div>

              {/* Text content (right side of card) */}
              <div className="flex-1 min-w-0">
                {/* Category icon + name */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.35 }}
                  className="flex items-center gap-2.5 mb-2"
                >
                  <span
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${hex}20` }}
                  >
                    <Icon size={18} className={cat.accentColor} />
                  </span>
                  <span className="text-lg font-bold text-white">{cat.name}</span>
                </motion.div>

                {/* Short def */}
                <motion.p
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.18, duration: 0.35 }}
                  className="text-sm font-semibold text-white/70 mb-2"
                >
                  {cat.heroShortDef}
                </motion.p>

                {/* Full description */}
                <motion.p
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.24, duration: 0.35 }}
                  className="text-[13px] leading-relaxed text-white/50 mb-2.5"
                >
                  {cat.fullDescription}
                </motion.p>

                {/* Verified-by badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="text-[11px] uppercase tracking-wider text-white/30 mb-2"
                >
                  Verified by{' '}
                  <span className="text-white/50 font-semibold">
                    {cat.performedBy === 'law_firm'
                      ? 'Empanelled Law Firm'
                      : cat.performedBy === 'sme'
                        ? 'Independent SME Panel'
                        : 'WealthSpot Team'}
                  </span>
                </motion.div>
              </div>
            </div>

            {/* Sub-item chips */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.35 }}
              className="flex flex-wrap gap-2 mt-3"
            >
              {cat.subItems.slice(0, 5).map((s) => (
                <span
                  key={s.code}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.06] text-white/60 border border-white/[0.06]"
                >
                  <CheckCircle2 size={10} style={{ color: hex }} />
                  {s.label}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-3">
        {ASSESSMENT_CATEGORIES.map((c, idx) => {
          const isActive = idx === activeIndex
          const dotHex = accentHex(c.accentColor)
          return (
            <button
              key={c.code}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`View ${c.name}`}
              className="transition-all duration-300 rounded-full"
              style={{
                width: isActive ? 20 : 8,
                height: 8,
                backgroundColor: isActive ? dotHex : 'rgba(255,255,255,0.15)',
                boxShadow: isActive ? `0 0 10px ${dotHex}60` : 'none',
              }}
            />
          )
        })}
      </div>

      <ShieldInfoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}
