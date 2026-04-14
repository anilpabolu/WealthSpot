import { cn } from '@/lib/utils'
import { formatINRCompact, formatPercent } from '@/lib/formatters'
import FundingBar from './FundingBar'
import StatusBadge from './StatusBadge'
import type { StatusType } from './StatusBadge'
import { Mail, MessageCircle, Trash2, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useVaultConfig } from '@/hooks/useVaultConfig'

export interface PropertyCardProps {
  title: string
  city: string
  micromarket?: string
  assetType: string
  coverImage: string
  gallery?: string[]
  videoUrl?: string
  targetIrr: number
  minInvestment: number
  raised: number
  target: number
  investorCount?: number
  status?: StatusType
  reraNumber?: string
  className?: string
  isLoading?: boolean
  onInvestClick?: () => void
  onCardClick?: () => void
  /** Admin soft-delete */
  isAdmin?: boolean
  propertyId?: string
  onDelete?: (id: string) => void
}

export default function PropertyCard({
  title,
  city,
  micromarket,
  assetType,
  coverImage,
  gallery,
  videoUrl,
  targetIrr,
  minInvestment,
  raised,
  target,
  investorCount,
  reraNumber,
  status,
  className,
  isLoading = false,
  onInvestClick,
  onCardClick,
  isAdmin = false,
  propertyId,
  onDelete,
}: PropertyCardProps) {
  const { propertyVideosEnabled } = useVaultConfig()

  if (isLoading) {
    return (
      <div className={cn('bg-[var(--bg-card)] border border-theme/60 rounded-xl overflow-hidden', className)}>
        <div className="skeleton aspect-video w-full" />
        <div className="p-4 space-y-3">
          <div className="skeleton h-5 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
          <div className="flex gap-4">
            <div className="skeleton h-8 w-20" />
            <div className="skeleton h-8 w-20" />
          </div>
          <div className="skeleton h-1 w-full rounded-full" />
          <div className="skeleton h-4 w-24 ml-auto" />
        </div>
      </div>
    )
  }

  const isFunded = status === 'funded'
  const isUpcoming = status === 'upcoming'
  const fundedPct = target > 0 ? Math.round((raised / target) * 100) : 0

  // Build the images array: gallery first, fall back to coverImage
  const images = (gallery && gallery.length > 0) ? gallery : [coverImage]
  const hasMultiple = images.length > 1

  const [activeIdx, setActiveIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const touchStartRef = useRef<number>(0)

  // Auto-advance every 4 seconds when multiple images
  const startAutoPlay = useCallback(() => {
    if (!hasMultiple) return
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
    }, 4000)
  }, [hasMultiple, images.length])

  useEffect(() => {
    startAutoPlay()
    return () => clearInterval(intervalRef.current)
  }, [startAutoPlay])

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1))
    startAutoPlay()
  }
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
    startAutoPlay()
  }

  return (
    <div
      className={cn(
        'bg-[var(--bg-card)] backdrop-blur-sm border border-theme/60 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-theme/60 cursor-pointer group relative',
        className
      )}
      onClick={onCardClick}
      role="article"
      aria-label={`${title} — ${city}`}
    >
      {/* Image Carousel */}
      <div
        className="aspect-video relative overflow-hidden"
        onTouchStart={(e) => { touchStartRef.current = e.touches[0]?.clientX ?? 0 }}
        onTouchEnd={(e) => {
          const diff = touchStartRef.current - (e.changedTouches[0]?.clientX ?? 0)
          if (Math.abs(diff) > 50) {
            if (diff > 0) setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
            else setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1))
            startAutoPlay()
          }
        }}
      >
        <img
          src={images[activeIdx]}
          alt={`${title} - Image ${activeIdx + 1}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          width={640}
          height={360}
        />

        {/* Prev/Next buttons (visible on hover) */}
        {hasMultiple && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-theme-primary" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-theme-primary" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {hasMultiple && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActiveIdx(i); startAutoPlay() }}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeIdx ? 'w-4 bg-[var(--bg-surface)]' : 'w-1.5 bg-[var(--bg-card)]'
                }`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Video icon */}
        {propertyVideosEnabled && videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-12 bg-black/60 hover:bg-black/80 rounded-full p-1.5 transition-colors z-10"
            aria-label="Watch video"
            title="Watch property video"
          >
            <Play className="h-4 w-4 text-white fill-white" />
          </a>
        )}

        {/* Category badge */}
        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
          {assetType}
        </span>
        {/* Status badge — top right */}
        {status && (
          <span className="absolute top-3 right-3">
            <StatusBadge status={status} />
          </span>
        )}
        {/* Admin delete button */}
        {isAdmin && propertyId && onDelete && (
          <button
            className="absolute top-3 right-3 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm(`Archive "${title}"? It will no longer appear in listings.`)) {
                onDelete(propertyId)
              }
            }}
            aria-label={`Archive ${title}`}
            title="Archive this listing"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        {/* Property info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
          <h3 className="text-white font-semibold text-lg drop-shadow-sm">{title}</h3>
          <p className="text-[var(--border-default)] text-sm flex items-center gap-1">
            📍 {micromarket ? `${micromarket}, ` : ''}{city}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Financial metrics */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-theme-secondary font-semibold">Target IRR</p>
            <p className="font-mono font-bold text-2xl text-theme-primary">{formatPercent(targetIrr)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-theme-secondary font-semibold">Min Invest</p>
            <p className="font-mono font-bold text-lg text-theme-primary">{formatINRCompact(minInvestment)}</p>
          </div>
        </div>

        {/* Funding progress */}
        <FundingBar raised={raised} target={target} showLabels={false} />

        {/* Footer */}
        <div className="flex items-center justify-between mt-3">
          {investorCount !== undefined && (
            <span className="text-xs text-theme-tertiary">{investorCount} investors</span>
          )}
          {reraNumber && (
            <span className="text-xs text-theme-tertiary truncate max-w-[120px]" title={reraNumber}>
              RERA ✓
            </span>
          )}

          {/* CTA area — depends on status */}
          {isUpcoming ? (
            /* Upcoming: reminder buttons */
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-theme-tertiary mr-1">Notify me:</span>
              <a
                href={`https://wa.me/?text=I'm interested in ${encodeURIComponent(title)} on WealthSpot. Please notify me when it opens for investment.`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors"
                aria-label="Remind me via WhatsApp"
                title="Remind me via WhatsApp"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
              </a>
              <a
                href={`mailto:invest@wealthspot.in?subject=Interest in ${encodeURIComponent(title)}&body=Hi, I'm interested in ${encodeURIComponent(title)} and would like to be notified when it opens for investment.`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
                aria-label="Remind me via Email"
                title="Remind me via Email"
              >
                <Mail className="h-4 w-4 text-primary" />
              </a>
            </div>
          ) : isFunded ? (
            /* Fully Funded: disabled button */
            <button
              disabled
              className="text-theme-tertiary font-semibold text-sm ml-auto cursor-not-allowed select-none"
              aria-label="This property is fully funded"
            >
              FULLY FUNDED ✓
            </button>
          ) : (
            /* Default: invest now */
            <button
              className="text-primary font-semibold text-sm hover:underline ml-auto"
              onClick={(e) => {
                e.stopPropagation()
                onInvestClick?.()
              }}
              aria-label={`Invest now in ${title}`}
            >
              INVEST NOW ›
            </button>
          )}
        </div>
      </div>

      {/* Fully Funded hover overlay — shows full metrics */}
      {isFunded && (
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 gap-3">
          <p className="text-white font-display text-lg font-bold mb-1">Fully Funded</p>
          <div className="w-full grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Funded</p>
              <p className="text-white font-mono font-bold text-base mt-0.5">{fundedPct}%</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Capital Raised</p>
              <p className="text-white font-mono font-bold text-base mt-0.5">{formatINRCompact(raised)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Target IRR</p>
              <p className="text-white font-mono font-bold text-base mt-0.5">{formatPercent(targetIrr)}</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-white/60 text-[10px] uppercase tracking-wider font-semibold">Investors</p>
              <p className="text-white font-mono font-bold text-base mt-0.5">{investorCount ?? '—'}</p>
            </div>
          </div>
          <p className="text-white/50 text-xs mt-1">This offering is no longer accepting investments</p>
        </div>
      )}
    </div>
  )
}
