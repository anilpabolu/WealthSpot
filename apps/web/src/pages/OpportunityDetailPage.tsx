import { useParams, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import AuthGateModal from '@/components/AuthGateModal'
import SEOHead from '@/components/SEOHead'
import { useOpportunityBySlug } from '@/hooks/useOpportunities'
import { useLikeStatus, useToggleLike, useTrackShare, usePropertyReferralCode } from '@/hooks/useOpportunityActions'
import ShareModal from '@/components/share/ShareModal'
import { formatINRCompact, daysRemaining } from '@/lib/formatters'
import { getOpportunityInvestmentDisplay } from '@/utils/opportunity'
import {
  MapPin, ChevronRight, Heart, Share2,
  Sparkles, FileText, Camera, Home,
  Building2, Ruler, Calendar, FolderKanban, HandCoins, Globe, Users
} from 'lucide-react'
import * as LucideAllIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useHideOnScroll } from '@/hooks/useHideOnScroll'
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
import { CompanyInfoModal } from '@/components/opportunity/CompanyInfoModal'
import { InterestPanel } from '@/components/opportunity/InterestPanel'
import { OpportunityGallery } from '@/components/opportunity/OpportunityGallery'

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

/* ── Company Info Modal Extracted ───────────────────────────────────── */

/* ── Interest Panel Extracted ─────────────────────────────────────────── */

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

/* ── Opportunity Gallery Extracted ────────────────────────────────────── */



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
              property_type: opp.propertyType || opp.property_type,
              property_specs: opp.propertySpecs || opp.property_specs,
              propertyType: opp.propertyType || opp.property_type,
              propertySpecs: opp.propertySpecs || opp.property_specs,
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
