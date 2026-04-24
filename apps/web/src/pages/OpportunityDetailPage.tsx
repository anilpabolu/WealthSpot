import { useParams, Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import FundingBar from '@/components/wealth/FundingBar'
import IrrBadge from '@/components/wealth/IrrBadge'
import StatusBadge, { type StatusType } from '@/components/wealth/StatusBadge'
import { useOpportunityBySlug } from '@/hooks/useOpportunities'
import { useLikeStatus, useToggleLike, useTrackShare, usePropertyReferralCode } from '@/hooks/useOpportunityActions'
import ShareModal from '@/components/share/ShareModal'
import { formatINRCompact, daysRemaining } from '@/lib/formatters'
import {
  MapPin, Calendar, Users, Building2,
  ChevronRight, Play, Heart, Share2,
  Clock, ChevronLeft, Sparkles, HandCoins,
  X, Globe, Shield, Ruler, FolderKanban, BadgeCheck,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import ExpressInterestModal from '@/components/eoi/ExpressInterestModal'
import { EmptyState } from '@/components/ui'
import { useUserStore } from '@/stores/user.store'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import BuilderUpdatesPanel from '@/components/BuilderUpdatesPanel'
import { useProfilingProgress } from '@/hooks/useProfiling'
import ProfilingGateModal from '@/components/profiling/ProfilingGateModal'
import { useAppreciationHistory } from '@/hooks/useAppreciation'
import { ShieldSection } from '@/components/shield/ShieldSection'

/* ── Company Info Modal ─────────────────────────────────────────────── */

interface CompanyData {
  companyName: string
  brandName?: string | null
  logoUrl?: string | null
  verified?: boolean
  entityType?: string | null
  reraNumber?: string | null
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
            {company.reraNumber && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs text-theme-secondary">RERA Registration</p>
                  <p className="text-sm font-semibold text-theme-primary">{company.reraNumber}</p>
                </div>
              </div>
            )}
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

/** Derive lifecycle ribbon from status + dates + funding */
function getLifecycleRibbon(opp: { status: string; closingDate: string | null; raisedAmount: number; targetAmount: number | null }) {
  if (opp.status === 'closed') return { label: 'CLOSED', color: 'bg-red-600' }

  const closingDate = opp.closingDate ? new Date(opp.closingDate) : null
  const daysLeft = closingDate ? Math.ceil((closingDate.getTime() - Date.now()) / 86400000) : null
  const fundedPct = opp.targetAmount ? (opp.raisedAmount / opp.targetAmount) * 100 : 0

  if ((daysLeft !== null && daysLeft <= 7 && daysLeft > 0) || fundedPct >= 90)
    return { label: 'CLOSING SOON', color: 'bg-orange-500' }

  if (['approved', 'active', 'funding'].includes(opp.status))
    return { label: 'LIVE', color: 'bg-green-600' }

  return null
}

function OpportunityGallery({ images, title, videoUrl, propertyVideosEnabled }: { images: string[]; title: string; videoUrl?: string; propertyVideosEnabled: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const touchStartRef = useRef(0)

  const startAutoPlay = useCallback(() => {
    if (images.length <= 1) return
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
    }, 5000)
  }, [images.length])

  useEffect(() => {
    startAutoPlay()
    return () => clearInterval(intervalRef.current)
  }, [startAutoPlay])

  if (!images.length) {
    return (
      <div className="aspect-video bg-theme-surface-hover rounded-xl flex items-center justify-center">
        <Building2 className="h-16 w-16 text-theme-tertiary" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <div
          className="aspect-video rounded-xl overflow-hidden relative"
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
          <img src={images[activeIdx]} alt={`${title} - ${activeIdx + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement?.classList.add('bg-theme-surface-hover'); const placeholder = document.createElement('div'); placeholder.className = 'absolute inset-0 flex items-center justify-center bg-theme-surface-hover'; placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-theme-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>'; (e.target as HTMLImageElement).parentElement?.appendChild(placeholder); }} />
          {images.length > 1 && (
            <>
              <button onClick={() => { setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1)); startAutoPlay() }} className="absolute left-3 top-1/2 -translate-y-1/2 bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] rounded-full p-2 shadow" aria-label="Previous image">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => { setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0)); startAutoPlay() }} className="absolute right-3 top-1/2 -translate-y-1/2 bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] rounded-full p-2 shadow" aria-label="Next image">
                <ChevronRight className="h-5 w-5" />
              </button>
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
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button key={i} onClick={() => { setActiveIdx(i); startAutoPlay() }} className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 ring-2 transition-all ${i === activeIdx ? 'ring-primary' : 'ring-transparent hover:ring-gray-300'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.classList.add('bg-[var(--bg-surface-hover)]'); }} />
              </button>
          ))}
        </div>
      )}
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
    </>
  )
}

function InterestPanel({ opportunity }: { opportunity: { id: string; title: string; status: string; raisedAmount: number; targetAmount: number | null; minInvestment: number | null; investorCount: number; targetIrr: number | null; closingDate: string | null } }) {
  const [showEOI, setShowEOI] = useState(false)
  const daysLeft = opportunity.closingDate ? daysRemaining(opportunity.closingDate) : 0
  const isClosed = opportunity.status === 'closed'

  return (
    <>
      <div className="card p-6 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <StatusBadge status={opportunity.status as StatusType} />
          {daysLeft > 0 && (
            <span className="text-xs text-theme-secondary flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {daysLeft} days left
            </span>
          )}
        </div>

        {opportunity.targetAmount != null && (
          <FundingBar raised={opportunity.raisedAmount} target={opportunity.targetAmount} showLabels showPercent showAmount />
        )}

        <div className="mt-3 mb-4 text-xs text-theme-secondary flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {opportunity.investorCount} investors
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {opportunity.targetIrr != null && (
            <div className="bg-theme-surface rounded-lg p-3">
              <p className="text-xs text-theme-secondary uppercase font-semibold">Target IRR</p>
              <IrrBadge value={opportunity.targetIrr} className="mt-1" />
            </div>
          )}
          {opportunity.minInvestment != null && (
            <div className="bg-theme-surface rounded-lg p-3">
              <p className="text-xs text-theme-secondary uppercase font-semibold">Min. Invest</p>
              <p className="font-mono font-bold text-lg text-theme-primary mt-1">{formatINRCompact(opportunity.minInvestment)}</p>
            </div>
          )}
        </div>

        {/* Express Interest button */}
        {!isClosed ? (
          <button
            onClick={() => setShowEOI(true)}
            className="btn-primary w-full text-base py-3 inline-flex items-center justify-center gap-2"
          >
            <HandCoins className="h-5 w-5" />
            Express Interest
          </button>
        ) : (
          <button disabled className="w-full text-base py-3 bg-[var(--bg-surface-hover)] text-theme-secondary rounded-lg cursor-not-allowed font-semibold">
            Opportunity Closed
          </button>
        )}

        <p className="text-center text-[11px] text-theme-tertiary mt-3">
          By expressing interest, you agree to our <Link to="/legal/terms" className="underline">Terms</Link>.
          Your contact details will not be shared.
        </p>
      </div>

      {showEOI && (
        <ExpressInterestModal
          opportunityId={opportunity.id}
          opportunityTitle={opportunity.title}
          minInvestment={opportunity.minInvestment ?? 0}
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
  const { propertyVideosEnabled, reraDisplayEnabled } = useVaultConfig()
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [showProfilingGate, setShowProfilingGate] = useState(false)

  // Auth / role
  const userRole = useUserStore((s) => s.user?.role)
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const isInvestorRole = userRole === 'investor'

  // Vault-specific DNA profiling progress (for gating)
  const { data: profilingProgress } = useProfilingProgress(opp?.vaultType ?? '')
  const dnaComplete = profilingProgress?.isComplete ?? false
  // Gate: investor who hasn't completed this vault's DNA
  const needsProfilingGate = isAuthenticated && isInvestorRole && !dnaComplete

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

  // Auto-trigger profiling gate for investors without vault DNA (must be before early returns)
  useEffect(() => {
    if (needsProfilingGate && opp) setShowProfilingGate(true)
  }, [needsProfilingGate, opp])

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
  const coverUrl = opp.media?.find(m => m.isCover)?.url ?? opp.coverImage

  const galleryImages = opp.media?.length
    ? opp.media.map(m => m.url)
    : (coverUrl ? [coverUrl] : [])

  const ribbon = getLifecycleRibbon({
    status: opp.status,
    closingDate: opp.closingDate,
    raisedAmount: opp.raisedAmount,
    targetAmount: opp.targetAmount,
  })

  return (
    <MainLayout>
      <SEOHead
        title={opp.title}
        description={opp.tagline ?? opp.description?.slice(0, 160) ?? 'Investment opportunity on WealthSpot'}
        path={`/opportunity/${opp.slug}`}
        type="article"
      />
      <div className="page-section">
        <div className="page-section-container">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-theme-secondary mb-6">
          <Link to="/marketplace" className="hover:text-primary">Marketplace</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-theme-primary truncate">{opp.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery with lifecycle ribbon */}
            <div className="relative">
              {ribbon && (
                <div className={`absolute top-4 left-0 z-10 ${ribbon.color} text-white text-xs font-bold px-4 py-1.5 rounded-r-full shadow-lg`}>
                  {ribbon.label}
                </div>
              )}
              <OpportunityGallery images={galleryImages} title={opp.title} videoUrl={opp.videoUrl ?? undefined} propertyVideosEnabled={propertyVideosEnabled} />
            </div>

            {/* Title / Location */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl lg:text-3xl font-bold text-theme-primary">{opp.title}</h1>
                  {opp.tagline && <p className="text-theme-secondary mt-1 text-sm">{opp.tagline}</p>}
                  {opp.city && (
                    <p className="text-theme-secondary flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" /> {opp.locality ? `${opp.locality}, ` : ''}{opp.city}{opp.state ? `, ${opp.state}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleLike}
                    className={`p-2 rounded-lg border transition-colors ${likeData?.liked ? 'border-red-200 dark:border-red-700/40 bg-red-50 dark:bg-red-900/30' : 'border-theme hover:bg-theme-surface'}`}
                    aria-label={likeData?.liked ? 'Unlike' : 'Save'}
                  >
                    <Heart className={`h-5 w-5 ${likeData?.liked ? 'text-red-500 fill-red-500' : 'text-theme-tertiary'}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-lg border border-theme hover:bg-theme-surface"
                    aria-label="Share"
                  >
                    <Share2 className="h-5 w-5 text-theme-tertiary" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full capitalize">{opp.vaultType} vault</span>
                {opp.industry && <span className="px-3 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium rounded-full">{opp.industry}</span>}
                {opp.stage && <span className="px-3 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full capitalize">{opp.stage}</span>}
              </div>
            </div>

            {/* Description */}
            {opp.description && (
              <div className="card p-6">
                <h2 className="font-display text-lg font-bold text-theme-primary mb-3">About this Opportunity</h2>
                <p className="text-sm text-theme-secondary leading-relaxed whitespace-pre-line">{opp.description}</p>
              </div>
            )}

            {/* Vault-Specific Project Details */}
            {(() => {
              const details: Array<{ label: string; value: string; icon: typeof Calendar }> = []
              // Project phase (any vault — shows current construction/progress phase)
              if (opp.projectPhase)
                details.push({ label: 'Current Phase', value: opp.projectPhase.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: FolderKanban })
              // Wealth vault: RERA (conditionally shown via vault config)
              if (reraDisplayEnabled && opp.company && (opp.company as CompanyData).reraNumber)
                details.push({ label: 'RERA Number', value: (opp.company as CompanyData).reraNumber!, icon: Shield })
              // Wealth vault: Entity Type
              if (opp.company && (opp.company as CompanyData).entityType)
                details.push({ label: 'Entity Type', value: (opp.company as CompanyData).entityType!.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), icon: Building2 })
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
              // Launch date (any vault)
              if (opp.launchDate)
                details.push({ label: 'Launch Date', value: new Date(opp.launchDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), icon: Calendar })

              if (details.length === 0) return null
              return (
                <div className="card p-6">
                  <h2 className="font-display text-lg font-bold text-theme-primary mb-4">Project Details</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {details.map(d => {
                      const Icon = d.icon
                      return (
                        <div key={d.label} className="flex items-center gap-3 p-3 bg-theme-surface rounded-lg">
                          <Icon className="h-5 w-5 text-theme-tertiary shrink-0" />
                          <div>
                            <p className="text-xs text-theme-secondary">{d.label}</p>
                            <p className="text-sm font-semibold text-theme-primary">{d.value}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Location */}
            {(opp.address || opp.addressLine1 || opp.city) && (
              <div className="card p-6">
                <h2 className="font-display text-lg font-bold text-theme-primary mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Location Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {opp.addressLine1 && (
                    <div className="p-3 bg-theme-surface rounded-lg">
                      <p className="text-xs text-theme-secondary mb-0.5">Address</p>
                      <p className="text-sm font-medium text-theme-primary">{opp.addressLine1}{opp.addressLine2 ? `, ${opp.addressLine2}` : ''}</p>
                    </div>
                  )}
                  {opp.locality && (
                    <div className="p-3 bg-theme-surface rounded-lg">
                      <p className="text-xs text-theme-secondary mb-0.5">Area</p>
                      <p className="text-sm font-medium text-theme-primary">{opp.locality}</p>
                    </div>
                  )}
                  {opp.city && (
                    <div className="p-3 bg-theme-surface rounded-lg">
                      <p className="text-xs text-theme-secondary mb-0.5">City</p>
                      <p className="text-sm font-medium text-theme-primary">{opp.city}</p>
                    </div>
                  )}
                  {opp.pincode && (
                    <div className="p-3 bg-theme-surface rounded-lg">
                      <p className="text-xs text-theme-secondary mb-0.5">Pincode</p>
                      <p className="text-sm font-medium text-theme-primary">{opp.pincode}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WealthSpot Shield */}
            <ShieldSection opportunityId={opp.id} />

            {/* Company / Builder Info */}
            {opp.company && (
              <button
                type="button"
                onClick={() => setShowCompanyModal(true)}
                className="card p-6 w-full text-left cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all group"
              >
                <h2 className="font-display text-lg font-bold text-theme-primary mb-4">Developer / Company</h2>
                <div className="flex items-center gap-4">
                  {opp.company.logoUrl ? (
                    <img src={opp.company.logoUrl} alt={opp.company.companyName} className="h-12 w-12 rounded-lg object-contain border border-theme" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-theme-surface-hover flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-theme-tertiary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-theme-primary group-hover:text-primary transition-colors">{opp.company.companyName}</p>
                    {opp.company.brandName && <p className="text-xs text-theme-secondary">{opp.company.brandName}</p>}
                  </div>
                  <ChevronRight className="h-5 w-5 text-theme-tertiary group-hover:text-primary transition-colors shrink-0" />
                </div>
              </button>
            )}

            {/* Founder Info (for Opportunity Vault) */}
            {opp.founderName && (
              <div className="card p-6 bg-gradient-to-r from-violet-50 to-violet-100/50 border-violet-200 dark:border-violet-700/40">
                <h2 className="font-display text-lg font-bold text-theme-primary mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-violet-500" /> Founder
                </h2>
                <p className="text-sm font-medium text-theme-primary">{opp.founderName}</p>
                {opp.pitchDeckUrl && (
                  <a href={opp.pitchDeckUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                    View Pitch Deck <ChevronRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Right — Interest Panel + Builder Updates */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
            <div className="mb-6">
              <InterestPanel opportunity={{
                id: opp.id,
                title: opp.title,
                status: opp.status,
                raisedAmount: opp.raisedAmount,
                targetAmount: opp.targetAmount,
                minInvestment: opp.minInvestment,
                investorCount: opp.investorCount,
                targetIrr: opp.targetIrr,
                closingDate: opp.closingDate,
              }} />
            </div>

            {/* Builder Updates — separate section */}
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
            targetIrr: opp.targetIrr,
            minInvestment: opp.minInvestment,
            targetAmount: opp.targetAmount,
            raisedAmount: opp.raisedAmount,
            closingDate: opp.closingDate,
            investorCount: opp.investorCount,
            vaultType: opp.vaultType,
            media: opp.media,
            company: opp.company ? {
              companyName: opp.company.companyName,
              reraNumber: (opp.company as CompanyData).reraNumber,
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

      {/* Profiling gate modal for explorers */}
      {showProfilingGate && opp && (
        <ProfilingGateModal
          vaultType={opp.vaultType}
          onClose={() => setShowProfilingGate(false)}
          onComplete={() => setShowProfilingGate(false)}
        />
      )}
    </MainLayout>
  )
}
