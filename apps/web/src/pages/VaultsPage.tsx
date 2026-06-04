import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import SEOHead from '@/components/SEOHead'
import VaultProfilingModal from '@/components/VaultProfilingModal'

import { useOverallProgress, useRecordExplorer } from '@/hooks/useProfiling'
import {
  Building2,
  Compass,
  Rocket,
  Users,
  Wallet,
  PlayCircle,
  X,
  Lock,
  Banknote,
  Layers,
  MapPin,
  Handshake,
  UserCheck,
  ShieldCheck,
  BarChart2,
  CalendarClock,
  Plus,
  Eye,
  type LucideIcon,
} from 'lucide-react'
import CommunitySubtypeModal, { type CommunitySubtypeValue } from '@/components/CommunitySubtypeModal'
import { useUserStore } from '@/stores/user.store'
import { useVaultStats, useOpportunities, type OpportunityItem } from '@/hooks/useOpportunities'
import { usePublicVideos } from '@/hooks/useAppVideos'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { useVaultMetricsConfig } from '@/hooks/useVaultMetricsConfig'
import { useContent } from '@/hooks/useSiteContent'
import { getVaultComingSoonText } from '@/components/VaultComingSoonOverlay'
import { useSourceClicks, getSourceClickCount, useIncrementSourceClick } from '@/hooks/useSourceClicks'

/* Map vault/pillar IDs → app_videos section_tag */
const VAULT_VIDEO_TAGS: Record<string, string> = {
  wealth: 'wealth_vault_intro',
  safe: 'safe_vault_intro',
  community: 'community_vault_intro',
}
const GOLD_ACCENT = '#D4AF37'
/* ------------------------------------------------------------------ */
/*  Vault data                                                         */
/* ------------------------------------------------------------------ */

const VAULTS = [
  {
    id: 'wealth',
    title: 'Wealth Vault',
    icon: Building2,
    color: 'from-[#1B2A4A] via-[#2D4A7A] to-[#1B3A5A]',
    accent: 'text-[#D4AF37]',
    accentHex: GOLD_ACCENT,
    bg: 'bg-[#F5F0E1]',
    border: 'border-[#D4AF37]/20',
    hoverShadow: 'hover:shadow-vault-wealth',
    borderLeft: 'border-l-[#D4AF37]',
    infoBody: 'A premium gateway to curated real estate opportunities positioned around intrinsic value, timing, and long-term appreciation potential.',
    infoItalic: 'Designed for investors who believe disciplined entry can shape exceptional outcomes.',
    risk: 'Moderate',
    riskColor: 'text-[#D4AF37] bg-[#D4AF37]/10',
    href: '/marketplace?vault=wealth',
    cta: 'Explore Properties',
    videoSrc: 'https://www.w3schools.com/html/mov_bbb.mp4',
    emoji: '🏛️',
  },
  {
    id: 'safe',
    title: 'Safe Vault',
    icon: Rocket,
    color: 'from-[#0D4A3A] via-[#145C47] to-[#0A3A2E]',
    accent: 'text-[#D4AF37]',
    accentHex: GOLD_ACCENT,
    bg: 'bg-[#F0FBF8]',
    border: 'border-[#20E3B2]/20',
    hoverShadow: 'hover:shadow-vault-opportunity',
    borderLeft: 'border-l-[#D4AF37]',
    infoBody: 'A fixed-return investment secured by mortgage agreements on real property. Earn interest monthly, quarterly, or yearly — backed by tangible assets.',
    infoItalic: 'Designed for investors who want predictable yields with real-estate-grade security and zero equity risk.',
    risk: 'Low–Moderate',
    riskColor: 'text-[#D4AF37] bg-[#D4AF37]/10',
    href: '/marketplace?vault=safe',
    cta: 'Explore Safe Investments',
    videoSrc: 'https://www.w3schools.com/html/movie.mp4',
    emoji: '🔒',
  },
  {
    id: 'community',
    title: 'Community Vault',
    icon: Users,
    color: 'from-[#D97706] via-[#F59E0B] to-[#B45309]',
    accent: 'text-[#D4AF37]',
    accentHex: GOLD_ACCENT,
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#065F46]/20',
    hoverShadow: 'hover:shadow-vault-community',
    borderLeft: 'border-l-[#D4AF37]',
    infoBody: 'A trusted environment where co-investors, co-partners, and execution-led collaborators can align around opportunity.',
    infoItalic: 'It exists to help serious people find one another, structure participation intelligently, and move from interest to closure with confidence.',
    risk: 'Low–Moderate',
    riskColor: 'text-[#D4AF37] bg-[#D4AF37]/10',
    href: '/marketplace?vault=community',
    cta: 'Explore Communities',
    videoSrc: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    emoji: '🤝',
  },
]

/* ------------------------------------------------------------------ */
/*  Video Popup                                                        */
/* ------------------------------------------------------------------ */

function VaultVideoPopup({ title, videoSrc, onClose }: { title: string; videoSrc: string; onClose: () => void }) {
  const [videoError, setVideoError] = useState(false)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
        style={{ width: '75vw', height: '75vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-white" />
        </button>

        {/* Title bar */}
        <div className="absolute top-3 left-4 z-10">
          <span className="text-white/80 text-sm font-semibold">{title}</span>
        </div>

        {/* Video */}
        {videoError ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <PlayCircle className="h-12 w-12 text-white/20" />
            <p className="text-white/50 text-sm">Video could not be loaded</p>
            <button onClick={() => setVideoError(false)} className="text-xs text-primary hover:underline">Retry</button>
          </div>
        ) : (
          <video
            src={videoSrc}
            className="w-full h-full object-contain"
            autoPlay
            muted
            controls
            playsInline
            onError={() => setVideoError(true)}
          />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Helper: format INR compact                                         */
/* ------------------------------------------------------------------ */

function formatINRCompact(num: number): string {
  if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(1)} Cr`
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)} L`
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(0)}K`
  return `₹${num.toLocaleString('en-IN')}`
}

/* ------------------------------------------------------------------ */
/*  Vault Card                                                         */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Vault Metrics Registry                                             */
/* ------------------------------------------------------------------ */

type MetricDef = {
  label: string
  icon: LucideIcon
  resolve: (stats: { totalInvested: number; investorCount: number; opportunityCount: number; explorerCount: number; dnaInvestorCount: number; minInvestment: number | null; avgTicketSize: number | null; citiesCovered: number; sectorsCovered: number; coInvestorCount: number; coPartnerCount: number; platformUsersCount: number; listingsCount: number; avgInterestRate: number | null; avgTenureMonths: number | null; mortgageCoveragePct: number | null; avgProjectSize: number | null; collaborationRate: number | null } | undefined, vaultId: string) => string
}

// eslint-disable-next-line react-refresh/only-export-components
export const VAULT_METRICS_REGISTRY: Record<string, MetricDef> = {
  total_invested: {
    label: 'Total Invested',
    icon: Wallet,
    resolve: (s) => (s ? formatINRCompact(s.totalInvested) : '—'),
  },
  investor_count: {
    label: 'Investors',
    icon: Users,
    resolve: (s) => (s ? s.investorCount.toLocaleString('en-IN') : '—'),
  },
  properties_listed: {
    label: 'Properties Listed',
    icon: Building2,
    resolve: (s) => (s ? s.opportunityCount.toLocaleString('en-IN') : '—'),
  },
  min_investment: {
    label: 'Min Investment',
    icon: Banknote,
    resolve: (s) => (s?.minInvestment != null ? formatINRCompact(s.minInvestment) : '—'),
  },
  startups_listed: {
    label: 'Startups Listed',
    icon: Rocket,
    resolve: (s) => (s ? s.opportunityCount.toLocaleString('en-IN') : '—'),
  },
  avg_ticket_size: {
    label: 'Avg Ticket Size',
    icon: Banknote,
    resolve: (s) => (s?.avgTicketSize != null ? formatINRCompact(s.avgTicketSize) : '—'),
  },
  sectors_covered: {
    label: 'Sectors Covered',
    icon: Layers,
    resolve: (s) => (s ? s.sectorsCovered.toLocaleString('en-IN') : '—'),
  },
  projects_launched: {
    label: 'Projects Launched',
    icon: Rocket,
    resolve: (s) => (s ? s.opportunityCount.toLocaleString('en-IN') : '—'),
  },
  co_investors: {
    label: 'Co-Investors',
    icon: Handshake,
    resolve: (s) => (s ? s.coInvestorCount.toLocaleString('en-IN') : '—'),
  },
  co_partners: {
    label: 'Co-Partners',
    icon: UserCheck,
    resolve: (s) => (s ? s.coPartnerCount.toLocaleString('en-IN') : '—'),
  },
  cities_covered: {
    label: 'Cities Covered',
    icon: MapPin,
    resolve: (s) => (s ? s.citiesCovered.toLocaleString('en-IN') : '—'),
  },
  explorer_count: {
    label: 'Explorers',
    icon: Compass,
    resolve: (s) => (s ? s.explorerCount.toLocaleString('en-IN') : '—'),
  },
  dna_investor_count: {
    label: 'DNA Investors',
    icon: UserCheck,
    resolve: (s) => (s ? s.dnaInvestorCount.toLocaleString('en-IN') : '—'),
  },
  platform_users: {
    label: 'Platform Users',
    icon: Users,
    resolve: (s) => (s ? s.platformUsersCount.toLocaleString('en-IN') : '—'),
  },
  listings_count: {
    label: 'Listings',
    icon: ShieldCheck,
    resolve: (s) => (s ? s.listingsCount.toLocaleString('en-IN') : '—'),
  },
  avg_interest_rate: {
    label: 'Avg Interest Rate',
    icon: BarChart2,
    resolve: (s) => (s?.avgInterestRate != null ? `${s.avgInterestRate}% p.a.` : '—'),
  },
  avg_tenure_months: {
    label: 'Avg Tenure',
    icon: CalendarClock,
    resolve: (s) => (s?.avgTenureMonths != null ? `${s.avgTenureMonths} mo` : '—'),
  },
  mortgage_coverage_pct: {
    label: 'Mortgage Backed',
    icon: ShieldCheck,
    resolve: (s) => (s?.mortgageCoveragePct != null ? `${s.mortgageCoveragePct}%` : '—'),
  },
  avg_project_size: {
    label: 'Avg Project Size',
    icon: Banknote,
    resolve: (s) => (s?.avgProjectSize != null ? formatINRCompact(s.avgProjectSize) : '—'),
  },
  collaboration_rate: {
    label: 'Collaboration Rate',
    icon: Handshake,
    resolve: (s) => (s?.collaborationRate != null ? `${s.collaborationRate}%` : '—'),
  },
}

/* All available metric keys per vault (for admin UI) */
// eslint-disable-next-line react-refresh/only-export-components
export const ALL_VAULT_METRICS: Record<string, string[]> = {
  wealth: ['total_invested', 'investor_count', 'explorer_count', 'dna_investor_count', 'platform_users', 'properties_listed', 'min_investment', 'cities_covered', 'expected_irr', 'actual_irr', 'avg_ticket_size'],
  safe: ['total_invested', 'investor_count', 'explorer_count', 'platform_users', 'listings_count', 'avg_interest_rate', 'avg_tenure_months', 'cities_covered', 'min_investment', 'mortgage_coverage_pct'],
  community: ['total_invested', 'investor_count', 'explorer_count', 'platform_users', 'projects_launched', 'co_investors', 'co_partners', 'avg_project_size', 'cities_covered', 'collaboration_rate'],
}

/* Creative hero images per vault — higher quality, verified relevant */
const VAULT_HERO_IMAGES: Record<string, string> = {
  // Wealth Vault — luxury real estate, private wealth
  wealth: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&auto=format&fit=crop&q=90',
  // Safe Vault — high-end solid real estate, symbolizing secure mortgage-backed foundations
  safe:   'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1400&auto=format&fit=crop&q=90',
  // Community Vault — business professionals collaborating
  community: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1400&auto=format&fit=crop&q=90',
}

/* ------------------------------------------------------------------ */
/*  Vault Card — single full-height image, blurred glass metrics panel */
/* ------------------------------------------------------------------ */

function VaultCard({
  vault,
  stats: _stats,
  opportunities: _opportunities,
  archetype: _archetype,
  comingSoon,
  enabledMetrics: _enabledMetrics,
  onPlayVideo,
  onComingSoon,
  onCommunityExplore,
  onExplore,
  onCreateOpportunity,
  visitCount,
}: {
  vault: (typeof VAULTS)[number]
  stats?: any
  opportunities?: any[]
  archetype?: string | null
  comingSoon: boolean
  enabledMetrics?: string[]
  onPlayVideo?: () => void
  onComingSoon: () => void
  onCommunityExplore?: () => void
  onExplore?: () => void
  onCreateOpportunity?: () => void
  visitCount: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  const handleCardClick = (e: React.MouseEvent) => {
    // If they clicked the video button, don't trigger the card link
    if ((e.target as HTMLElement).closest('.video-btn')) return;
    
    if (comingSoon) { e.preventDefault(); onComingSoon(); return; }
    if (vault.id === 'community' && onCommunityExplore) { e.preventDefault(); onCommunityExplore(); return; }
    if (!comingSoon) onExplore?.()
    navigate(vault.href)
  }

  const imgSrc = VAULT_HERO_IMAGES[vault.id] ?? `/images/vault-${vault.id}.jpg`

  return (
    <div
      onClick={handleCardClick}
      className="cursor-pointer rounded-[2.5rem] overflow-hidden group flex flex-col h-full relative transition-transform duration-500 ease-out bg-black"
      style={{
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: isHovered
          ? `0 24px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.15)`
          : '0 8px 24px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image - B&W by default, color on hover */}
      <img
        src={imgSrc}
        alt={vault.title}
        className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out opacity-80 group-hover:opacity-100"
        style={{
          transform: isHovered ? 'scale(1.04)' : 'scale(1)',
        }}
      />

      {/* Top fade (for badges) */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent opacity-90 pointer-events-none" />
      {/* Bottom fade for text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
      
      {/* Top section: Badges */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10 pointer-events-none">
        {/* Visit counter badge — top left */}
        <span
          className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 shadow-lg pointer-events-auto select-none"
          title="Total visits — the number of times users have entered this vault"
        >
          <Eye className="h-3.5 w-3.5 text-white/80" />
          {visitCount.toLocaleString('en-IN')}
        </span>


        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {comingSoon && (
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-lg">
              <Lock className="h-3 w-3" />
              Coming Soon
            </span>
          )}
          {onCreateOpportunity && (
            <button
              onClick={(e) => { e.stopPropagation(); onCreateOpportunity(); }}
              className="flex items-center justify-center h-8 w-8 text-[#D4AF37] bg-black/60 backdrop-blur-sm rounded-full border border-[#D4AF37]/50 hover:bg-[#D4AF37] hover:text-black hover:scale-105 transition-all shadow-lg"
              aria-label={`Create Opportunity for ${vault.title}`}
              title="Create Opportunity"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          {onPlayVideo && (
            <button
              onClick={onPlayVideo}
              className="video-btn flex items-center gap-1.5 text-[10px] font-bold text-white bg-black/55 backdrop-blur-sm px-3 py-1 rounded-full border border-white/15 hover:bg-black/80 hover:scale-105 transition-all"
              aria-label={`Watch ${vault.title} intro video`}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Watch Intro
            </button>
          )}
        </div>
      </div>

      {/* Content - Bottom */}
      <div className="relative z-10 mt-auto p-7 sm:p-8 flex flex-col pointer-events-none">
        {/* Divider line before title */}
        <div className="w-12 h-[2px] bg-purple-600 mb-5 opacity-90" />

        <h3 className="font-hero text-3xl sm:text-[2rem] font-bold text-white tracking-tight leading-tight mb-3" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          {vault.title}
        </h3>
        
        <p className="text-[13px] text-white/80 leading-relaxed font-body line-clamp-2 mb-6" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
          {vault.infoBody}
        </p>

        {/* Small "Express Interest" pill, matching the reference screenshot's red button at bottom right */}
        <div className="flex justify-between items-end gap-4 mt-2">
          <p className="text-[11px] text-white/60 italic font-medium leading-snug line-clamp-2 flex-1">
            {vault.infoItalic}
          </p>
          
          <div 
            className="shrink-0 flex items-center justify-center bg-purple-600 text-white rounded-full px-5 py-2.5 font-bold text-[10px] uppercase tracking-wider transition-all duration-300 group-hover:bg-purple-700 pointer-events-auto shadow-md"
          >
            {comingSoon ? 'Notify Me' : 'Express Interest'}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function VaultsPage() {
  const [activeVideo, setActiveVideo] = useState<{ title: string; videoSrc: string } | null>(null)
  const [showCommunityExplore, setShowCommunityExplore] = useState(false)
  const [comingSoonToast, setComingSoonToast] = useState<string | null>(null)
  const [profilingVault, setProfilingVault] = useState<string | null>(null)
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const userRoles = useUserStore((s) => s.user?.roles ?? [])
  const isSuperAdmin = userRoles.includes('super_admin')
  const navigate = useNavigate()
  const { isVaultEnabled, vaultVideosEnabled } = useVaultConfig()
  const { mutate: recordExplorer } = useRecordExplorer()
  const { data: sourceClicksMap } = useSourceClicks()
  const { mutate: incrementClick } = useIncrementSourceClick()

  
  const { data: metricsConfig } = useVaultMetricsConfig()

  const heroTitle    = useContent('vaults', 'hero_title',    'Pick Your Arena')
  const heroSubtitle = useContent('vaults', 'hero_subtitle', 'Each vault is a distinct investment class \u2014 real estate, fixed-income, or collaborative ventures. Find the one that matches your ambition.')

  const { data: overall } = useOverallProgress()
  const archetypeMap: Record<string, string | null> = {
    wealth:    overall?.vaults.wealth?.archetype    ?? null,
    safe:      overall?.vaults.safe?.archetype      ?? null,
    community: overall?.vaults.community?.archetype ?? null,
  }

  const { data: vaultStatsData } = useVaultStats()
  const statsMap = new Map((vaultStatsData ?? []).map((s) => [s.vaultType, s]))

  const { data: wealthOpps }    = useOpportunities({ vaultType: 'wealth' })
  const { data: safeOpps }      = useOpportunities({ vaultType: 'safe' })
  const { data: communityOpps } = useOpportunities({ vaultType: 'community' })
  const oppsMap: Record<string, OpportunityItem[]> = {
    wealth:    wealthOpps?.items    ?? [],
    safe:      safeOpps?.items      ?? [],
    community: communityOpps?.items ?? [],
  }

  const { data: managedVideos } = usePublicVideos('vaults')
  const videoUrlMap = new Map((managedVideos ?? []).map((v) => [v.sectionTag, v.videoUrl]))
  const resolveVideo = (tag: string | undefined, fallback: string): string =>
    (tag ? videoUrlMap.get(tag) : undefined) ?? fallback

  const showComingSoon = (vaultId: string) => {
    const text = getVaultComingSoonText(vaultId)
    setComingSoonToast(`${text.toast} ${text.toastSub}`)
    setTimeout(() => setComingSoonToast(null), 3500)
  }

  return (
    <>
      <SEOHead
        title="Investment Vaults"
        description="Explore WealthSpot's three investment vaults: Wealth Vault for real estate, Safe Vault for fixed-return mortgage-backed opportunities, and Community Vault for collaborative investing."
        path="/vaults"
        noIndex={true}
      />
      <MainLayout>

      {/* Hero — extends behind the transparent fixed navbar, matching landing-page behaviour */}
      <section id="hero" className="page-hero-navbar bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 -mt-16 relative overflow-hidden pt-[8.5rem] pb-14 lg:pb-16">
        {/* Subtle geometric decoration (lighter, purple-tinted to match landing) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
          <div className="animate-fade-up">
            <h1 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 tracking-tight leading-[1.1]">
              {heroTitle}
            </h1>
            <p className="text-white/60 max-w-2xl text-base leading-relaxed font-body">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Vaults Grid */}
      <section className="py-16 lg:py-20 content-section-bg relative overflow-hidden flex-1">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl" />
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-indigo-500/8 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {VAULTS.map((vault) => {
              const comingSoon = !isVaultEnabled(vault.id)
              return (
                <div key={vault.id} className="h-[480px] md:h-[540px] lg:h-[590px]">
                  <VaultCard
                      vault={vault}
                      stats={statsMap.get(vault.id)}
                      opportunities={oppsMap[vault.id] ?? []}
                      
                      archetype={archetypeMap[vault.id]}
                      comingSoon={comingSoon}
                      enabledMetrics={metricsConfig?.[vault.id] ?? ALL_VAULT_METRICS[vault.id] ?? []}
                      onCreateOpportunity={isSuperAdmin && vault.id === 'wealth' ? () => navigate(`/create-opportunity?vault=${vault.id}`) : undefined}
                      onPlayVideo={
                        vaultVideosEnabled
                          ? () => setActiveVideo({ title: vault.title, videoSrc: resolveVideo(VAULT_VIDEO_TAGS[vault.id], vault.videoSrc) })
                          : undefined
                      }
                      onComingSoon={() => showComingSoon(vault.id)}
                      onCommunityExplore={vault.id === 'community' ? () => setShowCommunityExplore(true) : undefined}
                      onExplore={() => {
                        incrementClick({ sourceType: 'vault', sourceId: vault.id })
                        if (isAuthenticated) recordExplorer(vault.id)
                      }}
                      visitCount={getSourceClickCount(sourceClicksMap, 'vault', vault.id)}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </MainLayout>

      {/* Vault intro video popup */}
      {vaultVideosEnabled && activeVideo && (
        <VaultVideoPopup
          title={activeVideo.title}
          videoSrc={activeVideo.videoSrc}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* Community subtype explore modal */}
      <CommunitySubtypeModal
        open={showCommunityExplore}
        onClose={() => setShowCommunityExplore(false)}
        mode="explore"
        onSelect={(subtype: CommunitySubtypeValue) => {
          setShowCommunityExplore(false)
          navigate(`/marketplace?vault=community&subtype=${subtype}`)
        }}
      />

      {/* Coming soon toast */}
      {comingSoonToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-xl shadow-2xl">
            <Lock className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="font-semibold text-sm">{comingSoonToast}</p>
          </div>
        </div>
      )}

      {/* Vault profiling modal */}
      {profilingVault && (
        <VaultProfilingModal
          vaultType={profilingVault}
          onClose={() => setProfilingVault(null)}
        />
      )}
    </>
  )
}
