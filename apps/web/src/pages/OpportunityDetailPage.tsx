import { useParams, Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import AuthGateModal from '@/components/AuthGateModal'
import SEOHead from '@/components/SEOHead'
import { useOpportunityBySlug } from '@/hooks/useOpportunities'
import { useLikeStatus, useToggleLike, useTrackShare, usePropertyReferralCode } from '@/hooks/useOpportunityActions'
import ShareModal from '@/components/share/ShareModal'
import { formatINRCompact, daysRemaining } from '@/lib/formatters'
import {
  MapPin, Calendar, Users, Building2,
  ChevronRight, Play, Heart, Share2,
  Clock, Sparkles, HandCoins,
  X, Globe, Ruler, FolderKanban, BadgeCheck, FileText,
  ShieldCheck, Lock, EyeOff, Camera, Home
} from 'lucide-react'
import * as LucideAllIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import WLogo3D from '@/components/ui/WLogo3D'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'
import ExpressInterestModal from '@/components/eoi/ExpressInterestModal'
import { EmptyState } from '@/components/ui'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import BuilderUpdatesPanel from '@/components/BuilderUpdatesPanel'
import LocationMapEmbed from '@/components/LocationMapEmbed'
import ProjectUspPanel from '@/components/ProjectUspPanel'
import { useAppreciationHistory } from '@/hooks/useAppreciation'
import { ShieldSection } from '@/components/shield/ShieldSection'
import { PropertySpecsSection } from '@/components/wealth/PropertySpecsSection'
import { ProjectThesisSection } from '@/components/wealth/ProjectThesisSection'
import { AMENITIES, AMENITY_CATEGORIES } from '@wealthspot/types'
import type { AmenityCategory } from '@wealthspot/types'
import { convertKeysToSnake } from '@wealthspot/api-client'

function _AmenityIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideAllIcons as unknown as Record<string, React.FC<LucideProps>>)[name]
  if (!Icon) return null
  return <Icon className={className ?? 'h-3.5 w-3.5'} />
}

/* ── Sticky Navigation ─────────────────────────────────────────────── */

function OpportunityNavigation({ sections }: { sections: Array<{ id: string, label: string, tooltip: string }> }) {
  const [activeId, setActiveId] = useState<string>('')
  const visible = useHideOnScroll()
  const scrollRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    )

    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  // Keep the active pill in view when the nav row overflows and scrolls horizontally.
  // IMPORTANT: Do NOT use btn.scrollIntoView() here — when the sticky nav bar is
  // hidden off-screen (via translateY), scrollIntoView scrolls the entire page
  // vertically to reveal the button, snapping the user back to the top.
  // Instead, manually scroll only the horizontal container.
  useEffect(() => {
    const btn = btnRefs.current[activeId]
    const container = scrollRef.current
    if (btn && container) {
      const btnRect = btn.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const scrollLeft = btn.offsetLeft - container.offsetLeft - (containerRect.width / 2) + (btnRect.width / 2)
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [activeId])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 140
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  if (sections.length === 0) return null

  return (
    <div
      className="sticky top-[var(--nav-height)] z-40 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hidden md:block"
      style={{ transform: visible ? 'translateY(0)' : 'translateY(calc(-100% - var(--nav-height)))' }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-16">
        {/* Horizontal scroll container: single row, centered when it fits, scrollable when it overflows */}
        <div ref={scrollRef} className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max max-w-full mx-auto items-center gap-2 lg:gap-3 py-3">
            {sections.map((section) => {
              const isActive = activeId === section.id
              return (
                <button
                  key={section.id}
                  ref={(el) => { btnRefs.current[section.id] = el }}
                  onClick={() => scrollTo(section.id)}
                  title={section.tooltip}
                  className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-bold tracking-wide transition-all duration-300 whitespace-nowrap ${
                    isActive ? 'bg-[#D4AF37]/15 text-[#8B6914] border border-[#D4AF37]/40 shadow-sm' : 'text-theme-secondary hover:bg-[var(--bg-surface-hover)] hover:text-theme-primary border border-transparent'
                  }`}
                >
                  {section.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Company Info Modal ─────────────────────────────────────────────── */

interface CompanyData {
  companyName: string
  brandName?: string | null
  logoUrl?: string | null
  verified?: boolean
  entityType?: string | null
  website?: string | null
  description?: string | null
  city?: string | null
  state?: string | null
  yearsInBusiness?: number | null
  projectsCompleted?: number
  totalAreaDeveloped?: string | null
}

function CompanyInfoModal({ company, onClose }: { company: CompanyData; onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const stats = [
    company.yearsInBusiness != null && { label: 'Years in Industry', value: `${company.yearsInBusiness}+`, icon: Calendar },
    company.projectsCompleted != null && company.projectsCompleted > 0 && { label: 'Projects Completed', value: String(company.projectsCompleted), icon: FolderKanban },
    company.totalAreaDeveloped && { label: 'Area Developed', value: company.totalAreaDeveloped, icon: Ruler },
  ].filter(Boolean) as Array<{ label: string; value: string; icon: typeof Calendar }>

  const entityLabel = company.entityType
    ? company.entityType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : null

  return (
    <div className="modal-overlay p-4">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={onClose} />
      <div className="modal-panel max-w-lg relative">
        {/* Header */}
        <div className="sticky top-0 bg-[var(--bg-surface)] border-b border-theme px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h2 className="font-display text-lg font-bold text-theme-primary">Developer / Company</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-theme-tertiary" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Company identity */}
          <div className="flex items-center gap-4">
            {company.logoUrl ? (
              <img src={company.logoUrl} alt={company.companyName} className="h-16 w-16 rounded-xl object-contain border border-theme" />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-theme-surface-hover flex items-center justify-center">
                <Building2 className="h-8 w-8 text-theme-tertiary" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-theme-primary truncate">{company.companyName}</h3>
                {company.verified && <BadgeCheck className="h-5 w-5 text-primary shrink-0" />}
              </div>
              {company.brandName && <p className="text-sm text-theme-secondary">{company.brandName}</p>}
              {entityLabel && <p className="text-xs text-theme-tertiary mt-0.5">{entityLabel}</p>}
            </div>
          </div>

          {/* Stats grid */}
          {stats.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {stats.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="bg-primary/5 rounded-xl p-4 text-center">
                    <Icon className="h-5 w-5 text-primary mx-auto mb-1.5" />
                    <p className="font-mono text-lg font-bold text-theme-primary">{s.value}</p>
                    <p className="text-[11px] text-theme-secondary font-medium mt-0.5">{s.label}</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Description */}
          {company.description && (
            <div>
              <h4 className="text-xs font-semibold text-theme-secondary uppercase mb-2">About</h4>
              <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-line">{company.description}</p>
            </div>
          )}

          {/* Details list */}
          <div className="space-y-3">
            {(company.city || company.state) && (
              <div className="flex items-center gap-3 p-3 bg-theme-surface rounded-lg">
                <MapPin className="h-5 w-5 text-theme-tertiary shrink-0" />
                <div>
                  <p className="text-xs text-theme-secondary">Headquartered In</p>
                  <p className="text-sm font-semibold text-theme-primary">{[company.city, company.state].filter(Boolean).join(', ')}</p>
                </div>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-3 p-3 bg-theme-surface rounded-lg">
                <Globe className="h-5 w-5 text-theme-tertiary shrink-0" />
                <div>
                  <p className="text-xs text-theme-secondary">Website</p>
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline">{company.website.replace(/^https?:\/\//, '')}</a>
                </div>
              </div>
            )}
          </div>

          {/* Close button */}
          <button onClick={onClose} className="btn-secondary w-full py-2.5">Close</button>
        </div>
      </div>
    </div>
  )
}

function getRawMinInvestment(
  minInvestment: number | null | undefined,
  propertySpecs: Record<string, unknown> | null | undefined
): number[] {
  const prices: number[] = []
  if (minInvestment != null && minInvestment > 0) {
    prices.push(minInvestment)
  }

  if (propertySpecs) {
    const specs = convertKeysToSnake(propertySpecs) as Record<string, unknown>
    const unitConfigs = specs.configurations as { price?: number; investment_amount?: number; price_per_sqft?: number; super_built_up_sqft?: number; carpet_area_sqft?: number }[] | undefined
    const plotConfigs = specs.plot_configurations as { price?: number; investment_amount?: number; price_per_sqft?: number; area_sqft?: number }[] | undefined

    if (unitConfigs?.length) {
      unitConfigs.forEach(u => {
        if (u.price != null && u.price > 0) prices.push(u.price)
        else if (u.investment_amount != null && u.investment_amount > 0) prices.push(u.investment_amount)
        else if (u.price_per_sqft && u.super_built_up_sqft) prices.push(u.price_per_sqft * u.super_built_up_sqft)
        else if (u.price_per_sqft && u.carpet_area_sqft) prices.push(u.price_per_sqft * u.carpet_area_sqft)
      })
    } else if (plotConfigs?.length) {
      plotConfigs.forEach(p => {
        if (p.price != null && p.price > 0) prices.push(p.price)
        else if (p.investment_amount != null && p.investment_amount > 0) prices.push(p.investment_amount)
        else if (p.price_per_sqft && p.area_sqft) prices.push(p.price_per_sqft * p.area_sqft)
      })
    } else if (typeof specs.price_per_sqft === 'number' && typeof specs.total_project_area_sqft === 'number') {
      prices.push(specs.price_per_sqft * specs.total_project_area_sqft)
    }
  }
  return prices
}

function getOpportunityInvestmentDisplay(
  minInvestment: number | null | undefined,
  propertySpecs: Record<string, unknown> | null | undefined
): string {
  const prices = getRawMinInvestment(minInvestment, propertySpecs)

  if (prices.length > 0) {
    const uniquePrices = Array.from(new Set(prices)).sort((a, b) => a - b)
    const minPrice = uniquePrices[0]
    if (minPrice !== undefined) {
      if (uniquePrices.length > 1) {
        return `Starting from ${formatINRCompact(minPrice)}`
      } else {
        return formatINRCompact(minPrice)
      }
    }
  }
  return '—'
}

/** Derive lifecycle ribbon from status + dates + funding */
function getLifecycleRibbon(opp: { status: string; closingDate: string | null; raisedAmount: number; targetAmount: number | null }) {  if (opp.status === 'closed') return { label: 'CLOSED', color: 'bg-red-600' }

  const closingDate = opp.closingDate ? new Date(opp.closingDate) : null
  const daysLeft = closingDate ? Math.ceil((closingDate.getTime() - Date.now()) / 86400000) : null
  const fundedPct = opp.targetAmount ? (opp.raisedAmount / opp.targetAmount) * 100 : 0

  if (opp.status === 'closed' || (daysLeft !== null && daysLeft <= 0))
    return { label: 'CLOSED', color: 'bg-red-600' }

  if ((daysLeft !== null && daysLeft <= 7 && daysLeft > 0) || fundedPct >= 90)
    return { label: 'CLOSING SOON', color: 'bg-orange-500' }

  if (['active', 'funding', 'live'].includes(opp.status) && (daysLeft === null || daysLeft > 0))
    return { label: 'LIVE', color: 'bg-green-600' }

  if (['approved', 'pending_approval', 'upcoming'].includes(opp.status))
    return { label: 'UPCOMING', color: 'bg-blue-600' }

  return null
}

function OpportunityGallery({ images, title, videoUrl, propertyVideosEnabled }: { images: string[]; title: string; videoUrl?: string; propertyVideosEnabled: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const touchStartRef = useRef(0)

  const startAutoPlay = useCallback(() => {
    if (images.length <= 1) return
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
    }, 5000)
  }, [images.length])

  // Circular navigation (wraps both directions — no blank slide).
  const goNext = useCallback(() => setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length])
  const goPrev = useCallback(() => setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length])

  useEffect(() => {
    startAutoPlay()
    return () => clearInterval(intervalRef.current)
  }, [startAutoPlay])

  // Lightbox: pause auto-play, lock body scroll, wire keyboard (Esc / arrows)
  // and block common save shortcuts (Ctrl/Cmd + S/P/C) while open.
  useEffect(() => {
    if (!lightboxOpen) return
    clearInterval(intervalRef.current)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrev()
      else if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c'].includes(e.key.toLowerCase())) e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      startAutoPlay()
    }
  }, [lightboxOpen, goNext, goPrev, startAutoPlay])

  // No images uploaded for this opportunity → show the WealthSpot brand logo
  // centered (no carousel / auto-play). Theme-aware: dark mark on light bg, light mark on dark bg.
  if (!images.length) {
    return (
      <div className="aspect-video bg-theme-surface-hover rounded-xl flex items-center justify-center">
        <WLogo3D size={120} light={false} className="opacity-90 block dark:hidden" />
        <WLogo3D size={120} light={true} className="opacity-90 hidden dark:block" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div
          className="aspect-video rounded-xl overflow-hidden relative bg-black/5 dark:bg-white/5"
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
            alt={`${title} - ${activeIdx + 1}`}
            onClick={() => setLightboxOpen(true)}
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full block object-cover cursor-zoom-in select-none"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none'; 
              target.parentElement?.classList.add('bg-theme-surface-hover');
              
              // Only add placeholder if it doesn't exist
              if (!target.parentElement?.querySelector('.fallback-placeholder')) {
                const placeholder = document.createElement('div'); 
                placeholder.className = 'fallback-placeholder absolute inset-0 flex items-center justify-center bg-theme-surface-hover'; 
                placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-theme-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>'; 
                target.parentElement?.appendChild(placeholder);
              }
            }}
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'block';
              const placeholder = target.parentElement?.querySelector('.fallback-placeholder');
              if (placeholder) placeholder.remove();
            }}
          />
          {images.length > 1 && (
            <>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button key={i} onClick={() => { setActiveIdx(i); startAutoPlay() }} className={`h-2 rounded-full transition-all ${i === activeIdx ? 'w-5 bg-[var(--bg-surface)]' : 'w-2 bg-[var(--bg-card)]'}`} aria-label={`Go to image ${i + 1}`} />
                ))}
              </div>
            </>
          )}
          <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">{activeIdx + 1} / {images.length}</span>
          {propertyVideosEnabled && videoUrl?.trim() && (
            <button
              onClick={() => setShowVideoPlayer(true)}
              className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Play className="h-4 w-4 fill-white" /> Watch Video
            </button>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {propertyVideosEnabled && showVideoPlayer && videoUrl?.trim() && (
        <div className="modal-overlay p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowVideoPlayer(false)} />
          <div className="relative bg-black rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
            <button
              onClick={() => setShowVideoPlayer(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
              aria-label="Close video"
            >
              <X className="h-5 w-5" />
            </button>
            <video
              src={videoUrl}
              controls
              autoPlay
              muted
              playsInline
              className="w-full aspect-video"
              controlsList="nodownload"
              onError={(e) => {
                const video = e.target as HTMLVideoElement;
                video.style.display = 'none';
                const msg = document.createElement('div');
                msg.className = 'w-full aspect-video flex flex-col items-center justify-center text-white/70 gap-3';
                msg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15.6 11.6L22 7v10l-6.4-4.6M4 5h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7c0-1.1.9-2 2-2z"/><line x1="2" y1="2" x2="22" y2="22" stroke-width="2"/></svg><span class="text-sm">Video is not available at this moment</span>';
                video.parentElement?.appendChild(msg);
              }}
            >
              Your browser does not support video playback.
            </video>
          </div>
        </div>
      )}

      {/* Image lightbox — click to enlarge. Portaled to body so it sits above all
          page chrome. Save deterrents: no right-click, no drag, no selection,
          pointer-events off the image (taps fall through to the overlay), and the
          element is hidden from print. (True screenshot blocking isn't possible in a browser.) */}
      {lightboxOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 secure-image-viewer select-none p-4"
          style={{ userSelect: 'none' }}
          onClick={() => setLightboxOpen(false)}
          onContextMenu={(e) => e.preventDefault()}
          onTouchStart={(e) => { touchStartRef.current = e.touches[0]?.clientX ?? 0 }}
          onTouchEnd={(e) => {
            const diff = touchStartRef.current - (e.changedTouches[0]?.clientX ?? 0)
            if (Math.abs(diff) > 50) { if (diff > 0) goNext(); else goPrev() }
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          <img
            src={images[activeIdx]}
            alt={`${title} - ${activeIdx + 1}`}
            draggable={false}
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl select-none pointer-events-none"
            style={{ userSelect: 'none' }}
          />

          {images.length > 1 && (
            <>
              <span className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white text-sm px-3 py-1 rounded-full">{activeIdx + 1} / {images.length}</span>
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveIdx(i) }}
                    className={`h-2.5 rounded-full transition-all ${i === activeIdx ? 'w-6 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
                    aria-label={`Go to image ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <style>{`@media print { .secure-image-viewer { display: none !important; } }`}</style>
        </div>,
        document.body,
      )}
    </>
  )
}

/* ── Small helpers ──────────────────────────────────────────────────── */

function TrustBadge({ icon: Icon, label }: { icon: React.FC<{ className?: string }>; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <span className="text-[9px] text-theme-tertiary leading-tight text-center">{label}</span>
    </div>
  )
}
/* ── Interest Panel (premium redesign) ─────────────────────────────── */

function InterestPanel({ opportunity }: { opportunity: { id: string; title: string; status: string; raisedAmount: number; targetAmount: number | null; minInvestment: number | null; investorCount: number; closingDate: string | null; property_type?: string | null; property_specs?: Record<string, unknown> | null; propertyType?: string | null; propertySpecs?: Record<string, unknown> | null } }) {
  const [showEOI, setShowEOI] = useState(false)
  const daysLeft = opportunity.closingDate ? daysRemaining(opportunity.closingDate) : 0
  const isClosed = opportunity.status === 'closed' || (opportunity.closingDate && daysLeft <= 0)
  const isUrgent = daysLeft > 0 && daysLeft <= 10

  return (
    <>
      <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/20 ring-1 ring-primary/25 transition-all duration-300 hover:ring-primary/40">
        {/* Dark premium header — matches hero palette */}
        <div className="relative px-5 pt-5 pb-6 overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0d1324 0%, #13102e 55%, #0d1324 100%)' }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full blur-2xl"
            style={{ background: 'rgba(212,175,55,0.12)' }} />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }} />
          <div className="relative z-10">
            <div className="flex items-center justify-end mb-4">
              {daysLeft > 0 && !isClosed ? (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                  isUrgent
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-white/50'
                }`}>
                  <Clock className="h-3.5 w-3.5" /> {daysLeft} days left
                </span>
              ) : isClosed ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-red-500/20 text-red-300 border border-red-500/30">
                  Closed
                </span>
              ) : null}
            </div>
            <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-1.5">Investment</p>
            <p className="font-mono font-bold text-xl leading-tight" style={{ color: '#D4AF37' }}>
              {getOpportunityInvestmentDisplay(opportunity.minInvestment, opportunity.propertySpecs || opportunity.property_specs)}
            </p>
            {opportunity.investorCount > 0 && (
              <p className="mt-2.5 text-white/40 text-[11px] flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {opportunity.investorCount} investor{opportunity.investorCount !== 1 ? 's' : ''} have expressed interest
              </p>
            )}
          </div>
        </div>

        {/* Card body */}
        <div className="bg-[var(--bg-card)] px-5 pt-4 pb-5">
          {!isClosed ? (
            <button
              onClick={() => setShowEOI(true)}
              className="w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #D4AF37 0%, #f0d060 50%, #b8952e 100%)',
                color: '#1a0e00',
                boxShadow: '0 8px 24px rgba(212,175,55,0.25)',
              }}
            >
              <HandCoins className="h-5 w-5" />
              Express Interest
            </button>
          ) : (
            <button disabled className="w-full py-3.5 rounded-xl bg-[var(--bg-surface-hover)] text-theme-secondary font-semibold cursor-not-allowed text-base">
              Opportunity Closed
            </button>
          )}

          <p className="text-center text-[10px] text-theme-tertiary mt-2.5 leading-relaxed">
            By expressing interest, you agree to our{' '}
            <Link to="/legal/terms" className="underline hover:text-theme-secondary">Terms</Link>.
            {' '}Your contact details will not be shared.
          </p>

          {/* Trust signals */}
          <div className="mt-4 pt-4 border-t border-theme grid grid-cols-3 gap-2">
            <TrustBadge icon={ShieldCheck} label="WealthSpot Verified" />
            <TrustBadge icon={Lock} label="Secure & Private" />
            <TrustBadge icon={EyeOff} label="Discreet Contact" />
          </div>
        </div>
      </div>

      {showEOI && (
        <ExpressInterestModal
          opportunityId={opportunity.id}
          opportunityTitle={opportunity.title}
          minInvestment={(() => {
            const prices = getRawMinInvestment(opportunity.minInvestment, opportunity.propertySpecs || opportunity.property_specs)
            if (prices.length > 0) {
              const uniquePrices = Array.from(new Set(prices)).sort((a, b) => a - b)
              return uniquePrices[0] ?? opportunity.minInvestment ?? 0
            }
            return opportunity.minInvestment ?? 0
          })()}
          propertyType={opportunity.propertyType ?? opportunity.property_type ?? undefined}
          unitConfigs={(((opportunity.propertySpecs ?? opportunity.property_specs)?.configurations ?? (opportunity.propertySpecs ?? opportunity.property_specs)?.unitConfigurations ?? (opportunity.propertySpecs ?? opportunity.property_specs)?.unit_configurations) as unknown[]) ?? undefined}
          plotConfigs={(((opportunity.propertySpecs ?? opportunity.property_specs)?.plotConfigurations ?? (opportunity.propertySpecs ?? opportunity.property_specs)?.plot_configurations) as unknown[]) ?? undefined}
          onClose={() => setShowEOI(false)}
        />
      )}
    </>
  )
}

export default function OpportunityDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { data: opp, isLoading } = useOpportunityBySlug(slug ?? '')
  const { propertyVideosEnabled } = useVaultConfig()
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCompanyModal, setShowCompanyModal] = useState(false)

  const { data: _appreciationHistory } = useAppreciationHistory(opp?.id ?? '')

  // Like state
  const { data: likeData } = useLikeStatus(opp?.id ?? '')
  const toggleLike = useToggleLike()
  const trackShare = useTrackShare()
  const { data: refCodeData } = usePropertyReferralCode(opp?.id ?? '')

  const handleLike = () => {
    if (!opp) return
    toggleLike.mutate(opp.id)
  }

  const handleShare = () => {
    if (!opp) return
    trackShare.mutate(opp.id)
    setShowShareModal(true)
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="skeleton aspect-video rounded-xl" />
              <div className="skeleton h-8 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-32 rounded-xl" />
            </div>
            <div className="skeleton h-96 rounded-xl" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!opp) {
    return (
      <MainLayout>
        <EmptyState icon={Building2} title="Opportunity Not Found" message="This opportunity may have been removed or the URL is incorrect." actionLabel="Back to Marketplace" onAction={() => navigate('/marketplace')} />
      </MainLayout>
    )
  }

  // Build gallery: prefer media with isCover, then gallery array, then coverImage
  const coverUrl = opp.media?.find(m => m.isCover)?.url ?? opp.coverImage ?? opp.gallery?.[0]

  const galleryImages = opp.media?.length
    ? opp.media.map(m => m.url)
    : opp.gallery?.length
      ? opp.gallery
      : (coverUrl ? [coverUrl] : [])

  const ribbon = getLifecycleRibbon({
    status: opp.status,
    closingDate: opp.closingDate,
    raisedAmount: opp.raisedAmount,
    targetAmount: opp.targetAmount,
  })

  const seoDescription =
    opp.tagline ?? opp.description?.slice(0, 160) ?? 'Investment opportunity on WealthSpot'
  const locationLabel = [opp.locality, opp.city, opp.state].filter(Boolean).join(', ')

  // schema.org Product + Offer + Breadcrumbs — makes the listing eligible for rich snippets.
  const opportunityJsonLd: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: opp.title,
      description: seoDescription,
      ...(coverUrl ? { image: coverUrl } : {}),
      ...(locationLabel ? { category: `Real Estate Investment — ${locationLabel}` } : {}),
      brand: { '@type': 'Brand', name: 'WealthSpot' },
      ...(opp.minInvestment
        ? {
            offers: {
              '@type': 'Offer',
              price: opp.minInvestment,
              priceCurrency: 'INR',
              availability:
                opp.status === 'closed'
                  ? 'https://schema.org/SoldOut'
                  : 'https://schema.org/InStock',
              url: `https://wealthspot.in/opportunity/${opp.slug}`,
            },
          }
        : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://wealthspot.in/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Marketplace',
          item: 'https://wealthspot.in/marketplace',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: opp.title,
          item: `https://wealthspot.in/opportunity/${opp.slug}`,
        },
      ],
    },
  ]

  return (
    <MainLayout>
      <SEOHead
        title={opp.title}
        description={seoDescription}
        path={`/opportunity/${opp.slug}`}
        image={coverUrl}
        type="article"
        jsonLd={opportunityJsonLd}
      />
      <section className="page-hero-navbar bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 -mt-16 relative overflow-hidden pt-[9rem] pb-8">
        {/* Geometric blur decorations — matches Vaults page */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
        </div>

        <div className="page-section-container relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex items-start gap-4">
              <button 
                onClick={() => navigate(opp.vaultType ? `/marketplace?vault=${opp.vaultType}` : '/marketplace')}
                className="mt-1 flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-colors backdrop-blur-md shrink-0"
                aria-label="Back to Vault"
                title="Back to Vault"
              >
                <Home className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                  {opp.title}
                </h1>
                {opp.tagline && <p className="text-white/70 text-lg max-w-2xl font-light">{opp.tagline}</p>}

                {opp.city && (
                  <p className="text-white/80 flex items-center gap-1.5 mt-3 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-[#D4AF37]" /> {opp.locality ? `${opp.locality}, ` : ''}{opp.city}{opp.state ? `, ${opp.state}` : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-md transition-all ${
                  likeData?.liked
                    ? 'border-red-500/50 bg-red-500/20 text-white'
                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                }`}
                aria-label={likeData?.liked ? 'Unlike' : 'Save'}
              >
                <Heart className={`h-4 w-4 ${likeData?.liked ? 'fill-red-500 text-red-500' : ''}`} />
                <span className="text-sm font-medium">{likeData?.liked ? 'Saved' : 'Save'}</span>
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all"
                aria-label="Share"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">Share</span>
              </button>
            </div>
          </div>

          {/* Quick-stats strip at the bottom of hero */}
          {((opp.minInvestment != null || opp.propertySpecs || opp.property_specs) || opp.closingDate) && (
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-6 sm:gap-10">
              {(opp.minInvestment != null || opp.propertySpecs || opp.property_specs) && (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-1">Investment</p>
                  <p className="font-mono font-bold text-xl text-white">
                    {getOpportunityInvestmentDisplay(opp.minInvestment, opp.propertySpecs || opp.property_specs)}
                  </p>
                </div>
              )}
              {opp.closingDate && daysRemaining(opp.closingDate) > 0 ? (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-1">Deal closes in</p>
                  <p className="font-bold text-xl text-white">
                    {daysRemaining(opp.closingDate)}{' '}
                    <span className="text-sm font-normal text-white/50">days</span>
                  </p>
                </div>
              ) : opp.closingDate && daysRemaining(opp.closingDate) <= 0 ? (
                <div>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-1">Status</p>
                  <p className="font-bold text-xl text-red-400">Closed</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <OpportunityNavigation sections={[
        { id: 'snapshot', label: 'Snapshot', tooltip: 'Key metrics and overview' },
        opp.description ? { id: 'about', label: 'About', tooltip: 'Project description' } : null,
        (opp.propertySpecs || opp.property_specs) ? { id: 'configurations', label: 'Configurations', tooltip: 'Unit or plot configurations' } : null,
        opp.projectPhase || opp.investmentMode || opp.investment_mode || opp.pricePerSqft || opp.price_per_sqft || opp.totalProjectAreaSqft || opp.total_project_area_sqft || opp.stage || opp.industry || opp.communityType || opp.collaborationType || opp.launchDate ? { id: 'project-details', label: 'Details', tooltip: 'Vault-specific details' } : null,
        (opp.latitude || opp.longitude || opp.mapsUrl || opp.addressLine1 || opp.address || opp.city || opp.state || opp.pincode) ? { id: 'location', label: 'Location', tooltip: 'Location map' } : null,
        (opp.propertyAmenities || opp.property_amenities) && (opp.propertyAmenities || opp.property_amenities)!.length > 0 && (opp.vaultType === 'wealth' || opp.vaultType === 'safe') ? { id: 'amenities', label: 'Amenities', tooltip: 'Project features' } : null,
        { id: 'shield', label: 'Shield', tooltip: 'WealthSpot due diligence' },
        { id: 'why-investors', label: 'Why', tooltip: 'Why investors are looking at this' },
        { id: 'investment-thesis', label: 'Thesis', tooltip: 'Our thesis on this project' },
        (opp.projectRoadmap || opp.project_roadmap) ? { id: 'roadmap', label: 'Roadmap', tooltip: 'Project timeline' } : null,
        { id: 'risk-factors', label: 'Risk Factors', tooltip: 'Key risks' },
        opp.founderName ? { id: 'founder', label: 'Founder', tooltip: 'Founder details' } : null
      ].filter(Boolean) as { id: string; label: string; tooltip: string }[]} />

      <div className="page-section mt-8 relative z-20">
        <div className="page-section-container">
          

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — Content */}
          <div className="lg:col-span-2 space-y-6 gold-cards">
            {/* Gallery with lifecycle ribbon */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/15 ring-1 ring-primary/10">
              {ribbon && (
                <div className={`absolute top-4 left-0 z-10 ${ribbon.color} text-white text-xs font-bold px-4 py-1.5 rounded-r-full shadow-lg`}>
                  {ribbon.label}
                </div>
              )}
              <OpportunityGallery images={galleryImages} title={opp.title} videoUrl={opp.videoUrl ?? undefined} propertyVideosEnabled={propertyVideosEnabled} />
            </div>

            {/* Opportunity Snapshot */}
            {(() => {
              const fmt = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

              const locationValue = opp.address ||
                [opp.locality, opp.district, opp.city, opp.state].filter(Boolean).join(', ') || null

              type SnapshotRow = { label: string; value: React.ReactNode }
              const snapshotData: SnapshotRow[] = [
                { label: 'Project Code Name', value: opp.title },
                opp.propertyType || opp.industry
                  ? { label: 'Asset Class', value: fmt(opp.propertyType || opp.industry || '') }
                  : null,
                locationValue ? { label: 'Location', value: locationValue } : null,
                (opp.mapsUrl || opp.maps_url)
                  ? { label: 'GPS Location', value: <a href={(opp.mapsUrl || opp.maps_url) as string} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 underline underline-offset-2 break-all">{(opp.mapsUrl || opp.maps_url) as string}</a> }
                  : null,
                (opp.developmentType || opp.development_type)
                  ? { label: 'Development Type', value: (opp.developmentType || opp.development_type) as string }
                  : null,
                (opp.projectPhase || opp.project_phase)
                  ? { label: 'Current Stage', value: fmt((opp.projectPhase || opp.project_phase) as string) }
                  : null,
                (opp.holdingPeriodMonths != null || opp.holding_period_months != null)
                  ? { label: 'Holding Period', value: `${opp.holdingPeriodMonths ?? opp.holding_period_months} Months` }
                  : null,
                { label: 'Entry Price', value: (opp.pricePerSqft || opp.price_per_sqft) ? `₹${Number(opp.pricePerSqft || opp.price_per_sqft).toLocaleString('en-IN')} / Sq.Ft` : 'TBA' },
                (opp.gstPercentage != null || opp.gst_percentage != null)
                  ? { label: 'GST', value: `${opp.gstPercentage ?? opp.gst_percentage}%` }
                  : null,
                { label: 'Projected Market Value at exit', value: (opp.projectedMarketValueAtExit || opp.projected_market_value_at_exit) ? `₹${Number(opp.projectedMarketValueAtExit || opp.projected_market_value_at_exit).toLocaleString('en-IN')} / Sq.Ft (Projected)` : 'TBA' },
                opp.tagline
                  ? { label: 'Investment Objective', value: opp.tagline }
                  : null,
              ].filter(Boolean) as SnapshotRow[]
              
              return (
                <div id="snapshot" className="card p-6 md:p-8 relative overflow-hidden scroll-mt-32">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-amber-400/10" />
                  <h2 className="font-display text-xl font-bold text-theme-primary mb-6 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-teal-500/15 text-teal-500 shrink-0"><Camera className="h-4 w-4" /></span>
                    Opportunity Snapshot
                  </h2>
                  
                  <div className="flex flex-col text-sm">
                    <div className="flex items-center pb-3 border-b border-[var(--border-default)] mb-1">
                        <div className="w-[35%] md:w-[30%] font-bold text-theme-primary">Field</div>
                        <div className="w-[65%] md:w-[70%] font-bold text-theme-primary">Details</div>
                    </div>
                    {snapshotData.map((row, idx) => (
                      <div key={row.label} className={`flex items-start sm:items-center py-4 ${idx !== snapshotData.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}>
                        <div className="w-[35%] md:w-[30%] text-theme-secondary font-medium pr-4">{row.label}</div>
                        <div className="w-[65%] md:w-[70%] text-theme-primary font-medium">{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* About this Opportunity */}
            {opp.description && (
              <div id="about" className="card p-6 relative overflow-hidden scroll-mt-32">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-amber-400/10" />
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
                  style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.3), transparent)' }} />
                <h2 className="font-display text-lg font-bold text-theme-primary mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/15 text-amber-500 dark:text-amber-400 shrink-0"><FileText className="h-4 w-4" /></span>
                  About this Opportunity
                </h2>
                <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-line">{opp.description}</p>
              </div>
            )}

            {/* Offering Configurations — unit or plot table derived from property_specs */}
            {(opp.propertySpecs || opp.property_specs) && (() => {
              // api-client camelCases nested keys; normalize back to canonical snake_case.
              const specs = convertKeysToSnake(opp.propertySpecs || opp.property_specs || {}) as Record<string, unknown>
              const isPlot = (opp.propertyType || opp.property_type) === 'plot'

              type UnitCfg = { type: string; super_built_up_sqft?: number; price_per_sqft?: number }
              type PlotCfg = { type: string; area_sqft?: number; price_per_sqft?: number; total_plots?: number }

              const unitConfigs = !isPlot
                ? (specs.configurations as UnitCfg[] | undefined)?.filter(u => u.type)
                : undefined
              const plotConfigs = isPlot
                ? (specs.plot_configurations as PlotCfg[] | undefined)?.filter(p => p.type)
                : undefined

              const rows = isPlot ? plotConfigs : unitConfigs
              if (!rows?.length) return null

              return (
                <div id="configurations" className="card p-6 relative overflow-hidden scroll-mt-32">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-amber-400/10" />
                  <h2 className="font-display text-lg font-bold text-theme-primary mb-5 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-500 shrink-0">
                      <Ruler className="h-4 w-4" />
                    </span>
                    {isPlot ? 'Plot Configurations' : 'BHK / Unit Configurations'}
                  </h2>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse min-w-[420px]">
                      <thead>
                        <tr className="border-b border-[var(--border-default)]">
                          <th className="text-left text-[10px] font-bold uppercase tracking-wider text-theme-tertiary pb-3 pr-4">Type</th>
                          <th className="text-right text-[10px] font-bold uppercase tracking-wider text-theme-tertiary pb-3 px-4">
                            {isPlot ? 'Area (Sq.Ft)' : 'SBU (Sq.Ft)'}
                          </th>
                          <th className="text-right text-[10px] font-bold uppercase tracking-wider text-theme-tertiary pb-3 px-4">₹ / Sq.Ft</th>
                          <th className="text-right text-[10px] font-bold uppercase tracking-wider text-theme-tertiary pb-3 pl-4">
                            {isPlot ? 'Plot Cost' : 'Unit Cost'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {isPlot
                          ? (plotConfigs as PlotCfg[]).map((p, i) => {
                              const area = p.area_sqft
                              const price = p.price_per_sqft
                              const cost = area && price ? area * price : null
                              const typeVal = p.type
                              return (
                                <tr key={i} className="hover:bg-[var(--bg-surface-hover)]/40 transition-colors">
                                  <td className="py-3.5 pr-4 font-semibold text-theme-primary">{typeVal}</td>
                                  <td className="py-3.5 px-4 text-theme-secondary text-right">{area ? area.toLocaleString('en-IN') : '—'}</td>
                                  <td className="py-3.5 px-4 text-theme-secondary text-right">{price ? `₹${price.toLocaleString('en-IN')}` : '—'}</td>
                                  <td className="py-3.5 pl-4 text-right">
                                    {cost
                                      ? <span className="font-bold text-[#8B6914] bg-[#D4AF37]/8 border border-[#D4AF37]/25 px-3 py-1.5 rounded-lg">{formatINRCompact(cost)}</span>
                                      : <span className="text-theme-tertiary">—</span>}
                                  </td>
                                </tr>
                              )
                            })
                          : (unitConfigs as UnitCfg[]).map((u, i) => {
                              const area = u.super_built_up_sqft
                              const price = u.price_per_sqft
                              const cost = area && price ? area * price : null
                              const typeVal = u.type
                              return (
                                <tr key={i} className="hover:bg-[var(--bg-surface-hover)]/40 transition-colors">
                                  <td className="py-3.5 pr-4 font-semibold text-theme-primary">{typeVal}</td>
                                  <td className="py-3.5 px-4 text-theme-secondary text-right">{area ? area.toLocaleString('en-IN') : '—'}</td>
                                  <td className="py-3.5 px-4 text-theme-secondary text-right">{price ? `₹${price.toLocaleString('en-IN')}` : '—'}</td>
                                  <td className="py-3.5 pl-4 text-right">
                                    {cost
                                      ? <span className="font-bold text-[#8B6914] bg-[#D4AF37]/8 border border-[#D4AF37]/25 px-3 py-1.5 rounded-lg">{formatINRCompact(cost)}</span>
                                      : <span className="text-theme-tertiary">—</span>}
                                  </td>
                                </tr>
                              )
                            })
                        }
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
                    <p className="text-[11px] text-theme-tertiary leading-relaxed">
                      <span className="font-semibold text-theme-secondary">Disclaimer: </span>
                      Unit configurations and area statements are indicative placeholders and subject to revision based on final design and government statutory approvals.
                    </p>
                  </div>
                </div>
              )
            })()}

            {/* Property Specifications / Project Details — for Wealth & Safe vault */}
            {(opp.vaultType === 'wealth' || opp.vaultType === 'safe') && (opp.property_specs || opp.investment_mode) && (
              <div id="specifications" className="scroll-mt-32">
                <PropertySpecsSection
                  propertyType={opp.propertyType || opp.property_type || 'flat'}
                  pricePerSqft={opp.pricePerSqft ?? opp.price_per_sqft}
                  totalProjectAreaSqft={opp.totalProjectAreaSqft ?? opp.total_project_area_sqft}
                  specs={opp.propertySpecs || opp.property_specs || {}}
                  amenities={opp.propertyAmenities ?? opp.property_amenities ?? []}
                  amenityCostEstimate={opp.amenityCostEstimate ?? opp.amenity_cost_estimate}
                  investmentMode={opp.investmentMode ?? opp.investment_mode ?? undefined}
                />
              </div>
            )}

            {/* Vault-Specific Project Details */}
            {(() => {
              const details: Array<{ label: string; value: string; icon: typeof Calendar }> = []
              // Project phase (any vault — shows current construction/progress phase)
              if (opp.projectPhase)
                details.push({ label: 'Current Phase', value: opp.projectPhase.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: FolderKanban })
              // Investment mode
              if (opp.investment_mode)
                details.push({ label: 'Investment Mode', value: opp.investment_mode.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: HandCoins })
              // Real-estate specific
              if (opp.price_per_sqft)
                details.push({ label: 'Price / Sq.Ft', value: formatINRCompact(opp.price_per_sqft), icon: Building2 })
              if (opp.total_project_area_sqft)
                details.push({ label: 'Total Project Area', value: `${opp.total_project_area_sqft.toLocaleString('en-IN')} sq.ft`, icon: Ruler })
              // Opportunity vault: Stage & Industry
              if (opp.stage)
                details.push({ label: 'Stage', value: opp.stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: FolderKanban })
              if (opp.industry)
                details.push({ label: 'Sector / Industry', value: opp.industry, icon: Globe })
              // Community vault: Community Type & Collaboration
              if (opp.communityType)
                details.push({ label: 'Community Type', value: opp.communityType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: Users })
              if (opp.collaborationType)
                details.push({ label: 'Collaboration', value: opp.collaborationType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: HandCoins })
              // Dates
              if (opp.launchDate)
                details.push({ label: 'Launch Date', value: new Date(opp.launchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), icon: Calendar })

              if (details.length === 0) return null
              return (
                <div id="project-details" className="card p-6 relative overflow-hidden scroll-mt-32">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-amber-400/10" />
                  <h2 className="font-display text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 dark:text-blue-400 shrink-0"><FolderKanban className="h-4 w-4" /></span>
                    Project Details
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {details.map(d => {
                      const Icon = d.icon
                      return (
                        <div key={d.label} className="flex items-center gap-3 p-3.5 bg-[var(--bg-surface-hover)]/60 rounded-2xl border border-[var(--border-subtle)] hover:border-primary/20 transition-colors">
                          <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-[10px] text-theme-tertiary uppercase tracking-wide mb-0.5">{d.label}</p>
                            <p className="text-sm font-semibold text-theme-primary">{d.value}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}



            {/* Location Map */}
            {(opp.latitude || opp.longitude || opp.mapsUrl || opp.addressLine1 || opp.address || opp.city || opp.state || opp.pincode) && (
              <div id="location" className="scroll-mt-32">
                <LocationMapEmbed
                  latitude={opp.latitude}
                  longitude={opp.longitude}
                  mapsUrl={opp.mapsUrl}
                  address={opp.addressLine1 ?? opp.address}
                  city={opp.city}
                  state={opp.state}
                  pincode={opp.pincode}
                />
              </div>
            )}

            {/* Amenities & Features — shown for wealth/safe vault properties that have amenities */}
            {((opp.propertyAmenities || opp.property_amenities) && (opp.propertyAmenities || opp.property_amenities)!.length > 0) && (opp.vaultType === 'wealth' || opp.vaultType === 'safe') && (() => {
              const amenitiesList = opp.propertyAmenities || opp.property_amenities || []
              const resolved = AMENITIES.filter(a => amenitiesList.includes(a.key))
              const byCategory = Object.fromEntries(
                (Object.keys(AMENITY_CATEGORIES) as AmenityCategory[]).map(cat => [
                  cat,
                  resolved.filter(a => a.category === cat),
                ])
              ) as Record<AmenityCategory, typeof resolved>
              const nonEmpty = (Object.entries(AMENITY_CATEGORIES) as [AmenityCategory, string][]).filter(
                ([catKey]) => (byCategory[catKey]?.length ?? 0) > 0
              )
              if (nonEmpty.length === 0) return null
              return (
                <div id="amenities" className="card p-6 relative overflow-hidden scroll-mt-32">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-amber-400/10" />
                  <h2 className="font-display text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/15 text-violet-500 dark:text-violet-400 shrink-0"><Sparkles className="h-4 w-4" /></span>
                    Amenities &amp; Features
                  </h2>
                  <div className="space-y-4">
                    {nonEmpty.map(([catKey, catLabel]) => (
                      <div key={catKey}>
                        <p className="text-[11px] font-semibold text-theme-tertiary uppercase tracking-wider mb-2">{catLabel}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {byCategory[catKey].map(a => (
                            <span key={a.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-[var(--bg-surface-hover)]/60 border border-[var(--border-default)] hover:border-violet-400/40 text-theme-secondary transition-colors">
                              <_AmenityIcon name={a.icon} className="h-3 w-3 shrink-0" />
                              {a.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* WealthSpot Shield — placed high for trust-first UX */}
            <div id="shield" className="scroll-mt-32">
              <ShieldSection opportunityId={opp.id} />
            </div>

            <ProjectThesisSection
              title={opp.title}
              projectRoadmap={(opp.projectRoadmap || opp.project_roadmap) as any[] | null}
              riskFactors={(opp.riskFactors || opp.risk_factors) as string | null}
              whyInvestors={(opp.whyInvestors || opp.why_investors) as string | null}
              investmentThesis={(opp.investmentThesis || opp.investment_thesis) as string | null}
            />

            {/* Founder Info (for Opportunity Vault) */}
            {opp.founderName && (
              <div id="founder" className="card p-6 relative overflow-hidden scroll-mt-32">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400/60 via-amber-300/40 to-amber-400/10" />
                <h2 className="font-display text-lg font-bold text-theme-primary mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/15 text-violet-500 shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  Founder
                </h2>
                <p className="text-sm font-semibold text-theme-primary">{opp.founderName}</p>
                {opp.pitchDeckUrl && (
                  <a href={opp.pitchDeckUrl} target="_blank" rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary font-semibold hover:underline">
                    View Pitch Deck <ChevronRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right — Sidebar */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto space-y-4">
            <InterestPanel opportunity={{
              id: opp.id,
              title: opp.title,
              status: opp.status,
              raisedAmount: opp.raisedAmount,
              targetAmount: opp.targetAmount,
              minInvestment: opp.minInvestment,
              investorCount: opp.investorCount,
              closingDate: opp.closingDate,
              property_type: opp.property_type,
              property_specs: opp.property_specs,
            }} />

            <ProjectUspPanel usps={opp.locationUsps} />

            {/* Developer / Company Info Button */}
            {opp.company && (
              <button
                type="button"
                onClick={() => setShowCompanyModal(true)}
                className="card p-5 w-full text-left cursor-pointer hover:border-primary/50 transition-all group shadow-sm"
              >
                <h3 className="font-display text-base font-bold text-theme-primary mb-3">About the Developer</h3>
                <div className="flex items-center gap-3">
                  {opp.company.logoUrl ? (
                    <img src={opp.company.logoUrl} alt={opp.company.companyName} className="h-12 w-12 rounded-lg object-contain border border-theme bg-white" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-[var(--bg-surface-hover)] flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-theme-tertiary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-theme-primary group-hover:text-primary transition-colors line-clamp-2">{opp.company.companyName}</p>
                    {opp.company.brandName && <p className="text-[11px] text-theme-secondary truncate mt-0.5">{opp.company.brandName}</p>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-theme-tertiary group-hover:text-primary transition-colors shrink-0" />
                </div>
              </button>
            )}

            <BuilderUpdatesPanel opportunityId={opp.id} />
          </div>
        </div>
        </div>
      </div>

      {/* Share Modal */}
      {opp && (
        <ShareModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          opportunity={{
            id: opp.id,
            title: opp.title,
            tagline: opp.tagline,
            description: opp.description,
            city: opp.city,
            coverImage: opp.coverImage,
            slug: opp.slug,
            minInvestment: opp.minInvestment,
            targetAmount: opp.targetAmount,
            raisedAmount: opp.raisedAmount,
            closingDate: opp.closingDate,
            investorCount: opp.investorCount,
            vaultType: opp.vaultType,
            media: opp.media,
            company: opp.company ? {
              companyName: opp.company.companyName,
              logoUrl: opp.company.logoUrl,
            } : null,
          }}
          referralCode={refCodeData?.code ?? ''}
        />
      )}

      {/* Company Info Modal */}
      {showCompanyModal && opp?.company && (
        <CompanyInfoModal
          company={opp.company}
          onClose={() => setShowCompanyModal(false)}
        />
      )}

      <AuthGateModal />

    </MainLayout>
  )
}
