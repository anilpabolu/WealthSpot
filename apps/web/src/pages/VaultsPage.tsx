import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VaultProfilingModal from '@/components/VaultProfilingModal'
import { useProfileCompletionStatus } from '@/hooks/useProfileAPI'
import { useProfilingProgress, useOverallProgress, useRecordExplorer } from '@/hooks/useProfiling'
import {
  Building2,
  Compass,
  Rocket,
  Users,
  TrendingUp,
  ArrowRight,
  Wallet,
  Clock,
  Network,
  GraduationCap,
  PlayCircle,
  X,
  Lock,
  Banknote,
  Layers,
  MapPin,
  Handshake,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'
import CreateOpportunityModal from '@/components/CreateOpportunityModal'
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
  opportunity: 'opportunity_vault_intro',
  community: 'community_vault_intro',
}
const PILLAR_VIDEO_TAGS: Record<string, string> = {
  'Wealth Investors': 'wealth_investors_pillar',
  'Time Investors': 'time_investors_pillar',
  'Network Investors': 'network_investors_pillar',
  'Education Investors': 'education_investors_pillar',
}

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
    accentHex: '#D4AF37',
    bg: 'bg-[#F5F0E1]',
    border: 'border-[#D4AF37]/20',
    hoverShadow: 'hover:shadow-vault-wealth',
    borderLeft: 'border-l-[#D4AF37]',
    infoBody: 'A premium gateway to curated real estate opportunities positioned around intrinsic value, timing, and long-term appreciation potential.',
    infoItalic: 'Designed for investors who believe disciplined entry can shape exceptional outcomes.',
    risk: 'Moderate',
    riskColor: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30',
    href: '/marketplace?vault=wealth',
    cta: 'Explore Properties',
    videoSrc: 'https://www.w3schools.com/html/mov_bbb.mp4',
    emoji: '🏛️',
  },
  {
    id: 'opportunity',
    title: 'Opportunity Vault',
    icon: Rocket,
    color: 'from-[#FF6B6B] via-[#FF8E8E] to-[#CC4848]',
    accent: 'text-[#FF6B6B]',
    accentHex: '#20E3B2',
    bg: 'bg-[#FFF0F0]',
    border: 'border-[#20E3B2]/20',
    hoverShadow: 'hover:shadow-vault-opportunity',
    borderLeft: 'border-l-[#20E3B2]',
    infoBody: 'A future-focused layer for those who contribute more than money alone.',
    infoItalic: 'It is being designed for participants who bring expertise, time, strategic guidance, or influential networks into emerging opportunities.',
    risk: 'High',
    riskColor: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
    href: '/marketplace?vault=opportunity',
    cta: 'Discover Startups',
    videoSrc: 'https://www.w3schools.com/html/movie.mp4',
    emoji: '🚀',
  },
  {
    id: 'community',
    title: 'Community Vault',
    icon: Users,
    color: 'from-[#D97706] via-[#F59E0B] to-[#B45309]',
    accent: 'text-[#065F46]',
    accentHex: '#065F46',
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#065F46]/20',
    hoverShadow: 'hover:shadow-vault-community',
    borderLeft: 'border-l-[#065F46]',
    infoBody: 'A trusted environment where co-investors, co-partners, and execution-led collaborators can align around opportunity.',
    infoItalic: 'It exists to help serious people find one another, structure participation intelligently, and move from interest to closure with confidence.',
    risk: 'Low–Moderate',
    riskColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30',
    href: '/marketplace?vault=community',
    cta: 'Explore Communities',
    videoSrc: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    emoji: '🤝',
  },
]

/* ------------------------------------------------------------------ */
/*  4 Investor Pillars                                                 */
/* ------------------------------------------------------------------ */

const PILLARS = [
  {
    title: 'Wealth Investors',
    subtitle: 'Capital that compounds',
    icon: Wallet,
    color: 'from-primary/10 to-primary/5',
    iconColor: 'text-primary',
    description:
      'Deploy capital across vaults and earn passive returns through rental income, equity appreciation, and profit-sharing — all from ₹10,000.',
    videoSrc: 'https://www.w3schools.com/html/mov_bbb.mp4',
    contributeHref: '/contribute/wealth',
  },
  {
    title: 'Time Investors',
    subtitle: 'Hours that create value',
    icon: Clock,
    color: 'from-amber-100 to-amber-50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    description:
      'Contribute your time and effort to community projects. Mentor founders, manage on-ground execution, or volunteer expertise — earn equity for your hours.',
    videoSrc: 'https://www.w3schools.com/html/movie.mp4',
    contributeHref: '/contribute/time',
  },
  {
    title: 'Network Investors',
    subtitle: 'Connections that catalyse',
    icon: Network,
    color: 'from-violet-100 to-violet-50',
    iconColor: 'text-violet-600 dark:text-violet-400',
    description:
      'Open doors with your relationships. Introduce startups to customers, connect projects to suppliers, or bring in co-investors — your network is your investment.',
    videoSrc: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
    contributeHref: '/contribute/network',
  },
  {
    title: 'Education Investors',
    subtitle: 'Knowledge that empowers',
    icon: GraduationCap,
    color: 'from-emerald-100 to-emerald-50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    description:
      'Share domain expertise, conduct workshops, or provide strategic advisory. Help ventures succeed through the power of what you know.',
    videoSrc: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    contributeHref: '/contribute/education',
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

/* Default expected IRR per vault (shown when API returns null) */
const DEFAULT_EXPECTED_IRR: Record<string, number> = {
  wealth: 14,
  opportunity: 18,
}

/* ------------------------------------------------------------------ */
/*  Vault Metrics Registry                                             */
/* ------------------------------------------------------------------ */

type MetricDef = {
  label: string
  icon: LucideIcon
  resolve: (stats: { totalInvested: number; investorCount: number; expectedIrr: number | null; actualIrr: number | null; opportunityCount: number; explorerCount: number; dnaInvestorCount: number; minInvestment: number | null; avgTicketSize: number | null; citiesCovered: number; sectorsCovered: number; coInvestorCount: number; coPartnerCount: number; platformUsersCount: number } | undefined, vaultId: string) => string
}

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
  expected_irr: {
    label: 'Expected IRR',
    icon: TrendingUp,
    resolve: (s, vaultId) => {
      const val = s?.expectedIrr ?? DEFAULT_EXPECTED_IRR[vaultId] ?? null
      return val != null ? `${val}%` : '—'
    },
  },
  actual_irr: {
    label: 'Actual IRR',
    icon: TrendingUp,
    resolve: (s) => (s?.actualIrr != null ? `${s.actualIrr}%` : '—'),
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
  avg_project_size: {
    label: 'Avg Project Size',
    icon: Banknote,
    resolve: (s) => (s?.avgTicketSize != null ? formatINRCompact(s.avgTicketSize) : '—'),
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
}

/* All available metric keys per vault (for admin UI) */
export const ALL_VAULT_METRICS: Record<string, string[]> = {
  wealth: ['total_invested', 'investor_count', 'explorer_count', 'dna_investor_count', 'platform_users', 'properties_listed', 'min_investment', 'cities_covered'],
  opportunity: ['total_invested', 'investor_count', 'explorer_count', 'dna_investor_count', 'platform_users', 'startups_listed', 'avg_ticket_size', 'sectors_covered'],
  community: ['total_invested', 'investor_count', 'explorer_count', 'dna_investor_count', 'platform_users', 'projects_launched', 'co_investors', 'co_partners', 'avg_project_size', 'cities_covered'],
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
  stats?: { totalInvested: number; investorCount: number; expectedIrr: number | null; actualIrr: number | null; opportunityCount: number; explorerCount: number; dnaInvestorCount: number; minInvestment: number | null; avgTicketSize: number | null; citiesCovered: number; sectorsCovered: number; coInvestorCount: number; coPartnerCount: number; platformUsersCount: number }
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
  const Icon = vault.icon

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
    <div className="rounded-3xl border border-[var(--frame-border)] bg-white dark:bg-gradient-to-br dark:from-[#161b2e] dark:via-[#1c2240] dark:to-[#141830] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.12)] hover:shadow-[0_8px_40px_rgba(212,175,55,0.1),0_2px_8px_rgba(0,0,0,0.12)] hover:border-[var(--frame-border-hover)] transition-all duration-300 group flex flex-col h-full hover:-translate-y-1">
      {/* Header band */}
      <div className={`bg-gradient-to-r ${vault.color} px-6 py-5 relative overflow-hidden`}>
        {/* Decorative background glow */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20 blur-2xl" />
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-hero text-xl font-bold text-white flex-1 tracking-tight">{vault.title}</h3>
          {!comingSoon && (
            <button
              onClick={(e) => { e.stopPropagation(); onProfilingCircleClick?.() }}
              className="shrink-0 relative h-9 w-9 cursor-pointer hover:scale-110 transition-transform"
              title={`${Math.round(profilingPct)}% profiled — click to ${profilingPct >= 100 ? 'view results' : 'continue'}`}
            >
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="3" />
                <circle cx="18" cy="18" r="14" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${(profilingPct / 100) * 87.96} 87.96`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/90">
                {Math.round(profilingPct)}%
              </span>
            </button>
          )}
          {comingSoon && (
            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Lock className="h-3 w-3" />
              Soon
            </span>
          )}
          {onPlayVideo && (
          <button
            onClick={onPlayVideo}
            className="relative shrink-0 group/tip"
            aria-label={`Watch ${vault.title} intro video`}
          >
            <PlayCircle className="h-7 w-7 text-white/70 hover:text-white transition-colors cursor-pointer" />
            <span className="pointer-events-none absolute -bottom-9 right-0 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg z-50">
              Watch Intro
            </span>
          </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5 flex-1 flex flex-col">
        {/* Vault description — moved from tooltip */}
        <div className="space-y-2">
          <p className="text-sm text-gray-600 dark:text-white/80 leading-relaxed font-body">{vault.infoBody}</p>
          <p className="text-[13px] text-[#D4AF37]/60 italic leading-relaxed font-body">{vault.infoItalic}</p>
        </div>

        {/* Metrics grid — dynamic from config */}
        <div className="grid grid-cols-2 gap-4">
          {enabledMetrics.map((key) => {
            const def = VAULT_METRICS_REGISTRY[key]
            if (!def) return null
            const MetricIcon = def.icon
            const value = def.resolve(stats, vault.id)
            const isIrr = key === 'actual_irr'
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-2">
                  <MetricIcon className={`h-3.5 w-3.5 ${isIrr ? 'text-emerald-400' : 'text-gray-400 dark:text-white/40'}`} />
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${isIrr ? 'text-emerald-400' : 'text-gray-400 dark:text-white/40'}`}>{def.label}</span>
                </div>
                <p className={`font-mono text-sm font-bold ${isIrr ? 'text-emerald-400' : key === 'expected_irr' ? vault.accent : 'text-gray-800 dark:text-white/90'}`}>
                  {value}
                </p>
              </div>
            )
          })}
        </div>

        {/* Bottom section: profiling + CTA anchored to card bottom */}
        <div className="mt-auto space-y-4">
          {/* Profiling progress */}


          {/* CTA */}
          {comingSoon ? (
            <button
              onClick={onComingSoon}
              className="w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl transition-colors bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-white/40 cursor-not-allowed border border-gray-200 dark:border-white/10"
            >
              <Lock className="h-4 w-4" />
              {getVaultComingSoonText(vault.id).button}
            </button>
          ) : (
            <Link
              to={vault.href}
              onClick={handleCTAClick}
              className="w-full inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-2xl transition-all duration-300 bg-gradient-to-r from-[#D4AF37] to-[#B8941F] text-slate-900 hover:opacity-90 hover:scale-[1.02] shadow-md"
            >
              {vault.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Pillar Card                                                        */
/* ------------------------------------------------------------------ */

function PillarCard({ pillar, onPlayVideo }: { pillar: (typeof PILLARS)[number]; onPlayVideo?: () => void }) {
  const Icon = pillar.icon

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--frame-border)] p-5 hover:border-[var(--frame-border-hover)] hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Dark warm background matching landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1510] via-[#111827]/90 to-[#0f172a] rounded-2xl" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-t-2xl" />
      <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#D4AF37]/[0.04] blur-2xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="h-12 w-12 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
            <Icon className="h-6 w-6 text-[#D4AF37]" />
          </div>
          {onPlayVideo && (
          <button
            onClick={onPlayVideo}
            className="relative group/tip shrink-0"
            aria-label={`Watch ${pillar.title} explainer video`}
          >
            <PlayCircle className="h-5 w-5 text-white/30 hover:text-white/60 transition-colors cursor-pointer" />
            <span className="pointer-events-none absolute -bottom-8 right-0 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg">
              Learn more
            </span>
          </button>
          )}
        </div>
        <h4 className="font-display text-base font-bold text-white mb-0.5">{pillar.title}</h4>
        <p className="text-xs font-medium text-[#D4AF37]/60 mb-2">{pillar.subtitle}</p>
        <p className="text-sm text-white/60 leading-relaxed flex-1">{pillar.description}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function VaultsPage() {
  const [activeVideo, setActiveVideo] = useState<{ title: string; videoSrc: string } | null>(null)
  const [activePillarVideo, setActivePillarVideo] = useState<{ title: string; videoSrc: string } | null>(null)
  const [showCreateOpp, setShowCreateOpp] = useState(false)
  const [showCommunityExplore, setShowCommunityExplore] = useState(false)
  const [comingSoonToast, setComingSoonToast] = useState<string | null>(null)
  const [profilingVault, setProfilingVault] = useState<string | null>(null)
  const userRole = useUserStore((s) => s.user?.role)
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const navigate = useNavigate()
  const { isVaultEnabled, vaultVideosEnabled } = useVaultConfig()
  const { mutate: recordExplorer } = useRecordExplorer()

  // Profile completion (for % circle navigation logic)
  const { data: profileCompletion } = useProfileCompletionStatus()

  // Fetch vault metrics config (which metrics to show per vault)
  const { data: metricsConfig } = useVaultMetricsConfig()

  // CMS content
  const heroBadge = useContent('vaults', 'hero_badge', 'Three Vaults. Infinite Possibilities.')
  const heroTitle = useContent('vaults', 'hero_title', 'Pick Your Arena')
  const heroSubtitle = useContent('vaults', 'hero_subtitle', 'Each vault is designed for a different investment class — real estate, startups, or community ventures. Find the one that matches your ambition.')
  const pillarsLabel = useContent('vaults', 'pillars_label', 'The Four Pillars')
  const pillarsHeading = useContent('vaults', 'pillars_heading', 'Every Investor Has Something Unique to Offer')
  const pillarsSubtitle = useContent('vaults', 'pillars_subtitle', "At WealthSpot, investing isn't just about money. We recognise four types of investors — each contributing a different kind of capital to create outsized value together.")

  // Fetch profiling progress per vault
  const { data: wealthProgress } = useProfilingProgress('wealth')
  const { data: opportunityProgress } = useProfilingProgress('opportunity')
  const { data: communityProgress } = useProfilingProgress('community')
  const { data: overall } = useOverallProgress()
  const profilingMap: Record<string, number> = {
    wealth: wealthProgress?.completionPct ?? 0,
    opportunity: opportunityProgress?.completionPct ?? 0,
    community: communityProgress?.completionPct ?? 0,
  }
  const archetypeMap: Record<string, string | null> = {
    wealth: overall?.vaults.wealth?.archetype ?? null,
    opportunity: overall?.vaults.opportunity?.archetype ?? null,
    community: overall?.vaults.community?.archetype ?? null,
  }

  // Fetch real vault stats from API
  const { data: vaultStatsData } = useVaultStats()
  const statsMap = new Map(
    (vaultStatsData ?? []).map((s) => [s.vaultType, s])
  )

  // Fetch all opportunities per vault for vault-card mini-lists
  const { data: wealthOpps } = useOpportunities({ vaultType: 'wealth' })
  const { data: opportunityOpps } = useOpportunities({ vaultType: 'opportunity' })
  const { data: communityOpps } = useOpportunities({ vaultType: 'community' })
  const oppsMap: Record<string, OpportunityItem[]> = {
    wealth: wealthOpps?.items ?? [],
    opportunity: opportunityOpps?.items ?? [],
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
    <div className="min-h-screen flex flex-col bg-theme-surface">
      {/* Shared Navbar */}
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 lg:py-28" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 35%, #4f46e5 70%, #6366f1 100%)' }}>
        {/* Subtle geometric decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-violet-500/8 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/5 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
          <div className="animate-fade-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/90 text-xs font-bold uppercase tracking-widest mb-6">
              {heroBadge}
            </span>
            <h1 className="font-hero text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-5 tracking-tight leading-[1.1]">
              {heroTitle}
            </h1>
            <p className="text-white/60 max-w-2xl text-lg leading-relaxed font-body">
              {heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Vaults Grid */}
      <section className="py-16 lg:py-20 content-section-bg relative overflow-hidden">
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

      {/* 4 Investor Pillars — super_admin only */}
      {userRole === 'super_admin' && (
      <section className="py-16 lg:py-20 content-section-bg relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-indigo-500/8 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
          <div className="text-center mb-10 relative z-10">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#D4AF37] dark:text-[#D4AF37]">{pillarsLabel}</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-theme-primary mt-2">
              {pillarsHeading}
            </h2>
            <p className="text-theme-secondary mt-2 max-w-2xl mx-auto">
              {pillarsSubtitle}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {PILLARS.map((pillar) => (
              <PillarCard
                key={pillar.title}
                pillar={pillar}
                onPlayVideo={vaultVideosEnabled ? () => setActivePillarVideo({ title: pillar.title, videoSrc: resolveVideo(PILLAR_VIDEO_TAGS[pillar.title], pillar.videoSrc) }) : undefined}
              />
            ))}
          </div>
        </div>
      </section>
      )}

      <Footer />
    </div>

      {/* Vault intro video popup */}
      {vaultVideosEnabled && activeVideo && (
        <VaultVideoPopup
          title={activeVideo.title}
          videoSrc={activeVideo.videoSrc}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* Pillar explainer video popup */}
      {vaultVideosEnabled && activePillarVideo && (
        <VaultVideoPopup
          title={activePillarVideo.title}
          videoSrc={activePillarVideo.videoSrc}
          onClose={() => setActivePillarVideo(null)}
        />
      )}

      {/* Create Opportunity modal */}
      <CreateOpportunityModal open={showCreateOpp} onClose={() => setShowCreateOpp(false)} />

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
