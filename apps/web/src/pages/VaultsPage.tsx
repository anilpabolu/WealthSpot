import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import MainLayout from '@/components/layout/MainLayout'
import SEOHead from '@/components/SEOHead'
import VaultProfilingModal from '@/components/VaultProfilingModal'
import { useProfileCompletionStatus } from '@/hooks/useProfileAPI'
import { useProfilingProgress, useOverallProgress, useRecordExplorer } from '@/hooks/useProfiling'
import {
  Building2,
  Compass,
  Rocket,
  Users,
  ArrowRight,
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

/* Creative hero images per vault */
const VAULT_HERO_IMAGES: Record<string, string> = {
  // Wealth Vault — luxury real estate, private wealth
  wealth: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
  // Safe Vault — gold bars, secure fixed returns
  safe: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=80',
  // Community Vault — people collaborating, co-investing
  community: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&auto=format&fit=crop&q=80',
}

function VaultCard({
  vault,
  stats,
  opportunities: _opportunities,
  profilingPct,
  archetype: _archetype,
  comingSoon,
  enabledMetrics,
  onPlayVideo,
  onComingSoon,
  onCommunityExplore,
  onProfilingCircleClick,
  onExplore,
}: {
  vault: (typeof VAULTS)[number]
  stats?: { totalInvested: number; investorCount: number; opportunityCount: number; explorerCount: number; dnaInvestorCount: number; minInvestment: number | null; avgTicketSize: number | null; citiesCovered: number; sectorsCovered: number; coInvestorCount: number; coPartnerCount: number; platformUsersCount: number; listingsCount: number; avgInterestRate: number | null; avgTenureMonths: number | null; mortgageCoveragePct: number | null; avgProjectSize: number | null; collaborationRate: number | null }
  opportunities: OpportunityItem[]
  profilingPct: number
  archetype?: string | null
  comingSoon: boolean
  enabledMetrics: string[]
  onPlayVideo?: () => void
  onComingSoon: () => void
  onCommunityExplore?: () => void
  onProfilingCircleClick?: () => void
  onExplore?: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const handleCTAClick = (e: React.MouseEvent) => {
    if (comingSoon) {
      e.preventDefault()
      onComingSoon()
    } else if (vault.id === 'community' && onCommunityExplore) {
      e.preventDefault()
      onCommunityExplore()
    }
    if (!comingSoon) {
      onExplore?.()
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden group flex flex-col h-[540px] relative"
      style={{
        border: `2px solid ${isHovered ? GOLD_ACCENT : GOLD_ACCENT + '35'}`,
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'border-color 0.3s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Top shimmer bar — glows brighter on hover ── */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] z-20 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent 5%, ${GOLD_ACCENT}bb 35%, ${GOLD_ACCENT} 50%, ${GOLD_ACCENT}bb 65%, transparent 95%)`,
          opacity: isHovered ? 1 : 0.35,
          transition: 'opacity 0.3s ease',
        }}
      />
      {/* ── Bottom radial glow — appears on hover ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-36 z-20 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 110%, ${GOLD_ACCENT}28 0%, transparent 68%)`,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* ── SECTION 1 (50%): hero image with text overlay ── */}
      <div className="relative h-1/2 overflow-hidden">
        <img
          src={VAULT_HERO_IMAGES[vault.id] ?? `/images/vault-${vault.id}.jpg`}
          alt={vault.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        {/* Gradient: transparent top → dark bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/5 pointer-events-none" />
        {/* Hover accent tint over image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${vault.accentHex}35 0%, transparent 60%)`,
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />

        {/* Top-right badges */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10">
          {comingSoon && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Lock className="h-3 w-3" />
              Coming Soon
            </span>
          )}
          {onPlayVideo && (
            <button
              onClick={onPlayVideo}
              className="flex items-center gap-1.5 text-[10px] font-bold text-white bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full hover:bg-black/70 transition-colors"
              aria-label={`Watch ${vault.title} intro video`}
            >
              <PlayCircle className="h-3.5 w-3.5" />
              Watch Intro
            </button>
          )}
        </div>

        {/* Profiling circle — sits just above the text block */}
        {!comingSoon && (
          <button
            onClick={(e) => { e.stopPropagation(); onProfilingCircleClick?.() }}
            className="absolute bottom-[72px] left-4 h-9 w-9 cursor-pointer hover:scale-110 transition-transform z-10"
            title={`${Math.round(profilingPct)}% profiled`}
          >
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90 drop-shadow-lg">
              <circle cx="18" cy="18" r="14" fill="rgba(0,0,0,0.4)" stroke="white" strokeOpacity="0.2" strokeWidth="3" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"
                strokeDasharray={`${(profilingPct / 100) * 87.96} 87.96`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
              {Math.round(profilingPct)}%
            </span>
          </button>
        )}

        {/* Title + description pinned to bottom of image — frosted glass backdrop */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-4 pt-8"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${vault.riskColor}`}>
              {vault.risk} Risk
            </span>
          </div>
          <h3 className="font-hero text-[1.05rem] font-bold text-white tracking-tight leading-snug mb-1.5"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}
          >
            {vault.title}
          </h3>
          <p className="text-[11.5px] text-white/85 leading-relaxed font-body line-clamp-2"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}
          >
            {vault.infoBody}
          </p>
        </div>
      </div>

      {/* ── SECTION 2 (40%): metrics — clean white card ── */}
      <div
        className="h-[40%] px-4 py-3 flex flex-col justify-center relative overflow-hidden"
        style={{
          background: '#ffffff',
          borderTop: `2px solid ${vault.accentHex}55`,
        }}
      >
        {/* Decorative accent dot */}
        <div
          className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 pointer-events-none"
          style={{ backgroundColor: vault.accentHex }}
        />
        {enabledMetrics.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 relative z-10">
            {enabledMetrics.slice(0, 4).map((key) => {
              const def = VAULT_METRICS_REGISTRY[key]
              if (!def) return null
              const MetricIcon = def.icon
              const value = def.resolve(stats, vault.id)
              return (
                <div
                  key={key}
                  className="space-y-0.5 pl-2.5"
                  style={{ borderLeft: `2px solid ${GOLD_ACCENT}55` }}
                >
                  <div className="flex items-center gap-1.5">
                    <MetricIcon className="h-3.5 w-3.5 shrink-0" style={{ color: GOLD_ACCENT + 'cc' }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 truncate">{def.label}</span>
                  </div>
                  <p className="font-mono text-[15px] font-bold text-gray-900">{value}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center italic">No metrics available</p>
        )}
      </div>

      {/* ── SECTION 3 (10%): CTA button ── */}
      <div
        className="h-[10%] flex items-center px-4"
        style={{
          background: '#ffffff',
          borderTop: `1px solid ${vault.accentHex}30`,
        }}
      >
        {comingSoon ? (
          <button
            onClick={onComingSoon}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border border-gray-200 text-gray-400 cursor-not-allowed"
          >
            <Lock className="h-3.5 w-3.5" />
            Explore Investment
          </button>
        ) : (
          <Link
            to={vault.href}
            onClick={handleCTAClick}
            className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border text-gray-900 bg-transparent transition-all duration-200 hover:text-[#0D1324]"
            style={{
              borderColor: GOLD_ACCENT + '80',
              '--hover-bg': GOLD_ACCENT,
            } as React.CSSProperties}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = GOLD_ACCENT; (e.currentTarget as HTMLElement).style.borderColor = GOLD_ACCENT; (e.currentTarget as HTMLElement).style.color = '#0D1324' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = GOLD_ACCENT + '80'; (e.currentTarget as HTMLElement).style.color = '#111827' }}
          >
            Explore Investment
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Pillar Card                                                        */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function VaultsPage() {
  const [activeVideo, setActiveVideo] = useState<{ title: string; videoSrc: string } | null>(null)
  const [showCommunityExplore, setShowCommunityExplore] = useState(false)
  const [comingSoonToast, setComingSoonToast] = useState<string | null>(null)
  const [profilingVault, setProfilingVault] = useState<string | null>(null)
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const { isVaultEnabled, vaultVideosEnabled } = useVaultConfig()
  const { mutate: recordExplorer } = useRecordExplorer()

  // Profile completion (for % circle navigation logic)
  const { data: profileCompletion } = useProfileCompletionStatus()

  // Fetch vault metrics config (which metrics to show per vault)
  const { data: metricsConfig } = useVaultMetricsConfig()

  // CMS content
  const heroTitle = useContent('vaults', 'hero_title', 'Pick Your Arena')
  const heroSubtitle = useContent('vaults', 'hero_subtitle', 'Each vault is designed for a different investment class — real estate, startups, or community ventures. Find the one that matches your ambition.')
  // Fetch profiling progress per vault
  const { data: wealthProgress } = useProfilingProgress('wealth')
  const { data: safeProgress } = useProfilingProgress('safe')
  const { data: communityProgress } = useProfilingProgress('community')
  const { data: overall } = useOverallProgress()
  const profilingMap: Record<string, number> = {
    wealth: wealthProgress?.completionPct ?? 0,
    safe: safeProgress?.completionPct ?? 0,
    community: communityProgress?.completionPct ?? 0,
  }
  const archetypeMap: Record<string, string | null> = {
    wealth: overall?.vaults.wealth?.archetype ?? null,
    safe: overall?.vaults.safe?.archetype ?? null,
    community: overall?.vaults.community?.archetype ?? null,
  }

  // Fetch real vault stats from API
  const { data: vaultStatsData } = useVaultStats()
  const statsMap = new Map(
    (vaultStatsData ?? []).map((s) => [s.vaultType, s])
  )

  // Fetch all opportunities per vault for vault-card mini-lists
  const { data: wealthOpps } = useOpportunities({ vaultType: 'wealth' })
  const { data: safeOpps } = useOpportunities({ vaultType: 'safe' })
  const { data: communityOpps } = useOpportunities({ vaultType: 'community' })
  const oppsMap: Record<string, OpportunityItem[]> = {
    wealth: wealthOpps?.items ?? [],
    safe: safeOpps?.items ?? [],
    community: communityOpps?.items ?? [],
  }

  // Fetch managed video URLs — override hardcoded defaults
  const { data: managedVideos } = usePublicVideos('vaults')
  const videoUrlMap = new Map(
    (managedVideos ?? []).map((v) => [v.sectionTag, v.videoUrl])
  )
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
                <VaultCard
                  key={vault.id}
                  vault={vault}
                  stats={statsMap.get(vault.id)}
                  opportunities={oppsMap[vault.id] ?? []}
                  profilingPct={profilingMap[vault.id] ?? 0}
                  archetype={archetypeMap[vault.id]}
                  comingSoon={comingSoon}
                  enabledMetrics={metricsConfig?.[vault.id] ?? ALL_VAULT_METRICS[vault.id] ?? []}
                  onPlayVideo={vaultVideosEnabled ? () => setActiveVideo({ title: vault.title, videoSrc: resolveVideo(VAULT_VIDEO_TAGS[vault.id], vault.videoSrc) }) : undefined}
                  onComingSoon={() => showComingSoon(vault.id)}
                  onCommunityExplore={vault.id === 'community' ? () => setShowCommunityExplore(true) : undefined}
                  onExplore={() => { if (isAuthenticated) recordExplorer(vault.id) }}
                  onProfilingCircleClick={() => {
                    if (!profileCompletion?.isComplete) {
                      navigate('/profile/complete')
                    } else if ((profilingMap[vault.id] ?? 0) >= 100) {
                      navigate(`/vault-profiling?vault=${vault.id}`)
                    } else {
                      setProfilingVault(vault.id)
                    }
                  }}
                />
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
