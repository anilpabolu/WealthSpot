import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useUser } from '@clerk/react'
import ProfileIndicator from '@/components/ProfileIndicator'
import {
  Building2,
  Rocket,
  Users,
  TrendingUp,
  Shield,
  ArrowRight,
  Wallet,
  Clock,
  Network,
  GraduationCap,
  AlertTriangle,
  MessageCircle,
  PieChart,
  PlayCircle,
  X,
  Plus,
  ClipboardCheck,
  Terminal,
} from 'lucide-react'
import CreateOpportunityModal from '@/components/CreateOpportunityModal'
import { useUserStore } from '@/stores/user.store'

/* ------------------------------------------------------------------ */
/*  Vault data                                                         */
/* ------------------------------------------------------------------ */

const VAULTS = [
  {
    id: 'wealth',
    title: 'Wealth Vault',
    icon: Building2,
    color: 'from-primary to-primary-dark',
    accent: 'text-primary',
    bg: 'bg-primary/5',
    border: 'border-primary/20',
    description:
      'Institutional-grade real estate investments — RERA-verified properties across India\'s top cities. Earn passive rental income and long-term capital appreciation through fractional ownership.',
    risk: 'Moderate',
    riskColor: 'text-amber-600 bg-amber-50',
    totalInvested: '₹42.5 Cr',
    investors: '8,200+',
    avgIrr: '14.2%',
    href: '/marketplace',
    cta: 'Explore Properties',
    videoSrc: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'opportunity',
    title: 'Opportunity Vault',
    icon: Rocket,
    color: 'from-violet-500 to-violet-700',
    accent: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    description:
      'Back high-potential startup ideas from vetted founders. From deep-tech to consumer brands — invest early in tomorrow\'s market leaders and earn equity-linked returns.',
    risk: 'High',
    riskColor: 'text-red-600 bg-red-50',
    totalInvested: '₹8.7 Cr',
    investors: '2,400+',
    avgIrr: '22.5%',
    href: '/marketplace?vault=opportunity',
    cta: 'Discover Startups',
    videoSrc: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'community',
    title: 'Community Vault',
    icon: Users,
    color: 'from-emerald-500 to-emerald-700',
    accent: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    description:
      'Community-driven opportunities where passionate individuals need collaborators — not just capital. Help establish sports complexes, co-working spaces, local businesses, and more by contributing your time, network, or expertise alongside funding.',
    risk: 'Low–Moderate',
    riskColor: 'text-emerald-600 bg-emerald-50',
    totalInvested: '₹3.2 Cr',
    investors: '1,150+',
    avgIrr: '11.8%',
    href: '/marketplace?vault=community',
    cta: 'Join Opportunities',
    videoSrc: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
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
    videoSrc: 'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    contributeHref: '/contribute/wealth',
  },
  {
    title: 'Time Investors',
    subtitle: 'Hours that create value',
    icon: Clock,
    color: 'from-amber-100 to-amber-50',
    iconColor: 'text-amber-600',
    description:
      'Contribute your time and effort to community projects. Mentor founders, manage on-ground execution, or volunteer expertise — earn equity for your hours.',
    videoSrc: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    contributeHref: '/contribute/time',
  },
  {
    title: 'Network Investors',
    subtitle: 'Connections that catalyse',
    icon: Network,
    color: 'from-violet-100 to-violet-50',
    iconColor: 'text-violet-600',
    description:
      'Open doors with your relationships. Introduce startups to customers, connect projects to suppliers, or bring in co-investors — your network is your investment.',
    videoSrc: 'https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    contributeHref: '/contribute/network',
  },
  {
    title: 'Education Investors',
    subtitle: 'Knowledge that empowers',
    icon: GraduationCap,
    color: 'from-emerald-100 to-emerald-50',
    iconColor: 'text-emerald-600',
    description:
      'Share domain expertise, conduct workshops, or provide strategic advisory. Help ventures succeed through the power of what you know.',
    videoSrc: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    contributeHref: '/contribute/education',
  },
]

/* ------------------------------------------------------------------ */
/*  Video Popup                                                        */
/* ------------------------------------------------------------------ */

function VaultVideoPopup({ title, videoSrc, onClose }: { title: string; videoSrc: string; onClose: () => void }) {
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
        <video
          src={videoSrc}
          className="w-full h-full object-contain"
          autoPlay
          controls
          playsInline
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Vault Card                                                         */
/* ------------------------------------------------------------------ */

function VaultCard({ vault, onPlayVideo }: { vault: (typeof VAULTS)[number]; onPlayVideo: () => void }) {
  const Icon = vault.icon

  return (
    <div className={`rounded-2xl border ${vault.border} bg-white overflow-hidden shadow-sm hover:shadow-lg transition-shadow group flex flex-col h-[480px]`}>
      {/* Header band */}
      <div className={`bg-gradient-to-r ${vault.color} px-6 py-5`}>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6 text-white" />
          </div>
          <h3 className="font-display text-xl font-bold text-white flex-1">{vault.title}</h3>
          <button
            onClick={onPlayVideo}
            className="relative shrink-0 group/tip"
            aria-label={`Watch ${vault.title} intro video`}
          >
            <PlayCircle className="h-7 w-7 text-white/70 hover:text-white transition-colors cursor-pointer" />
            {/* Tooltip */}
            <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg">
              Want to know more? Click here
            </span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5 flex-1 flex flex-col">
        <p className="text-sm text-gray-600 leading-relaxed">{vault.description}</p>

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Risk</span>
            </div>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${vault.riskColor}`}>
              {vault.risk}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Total Invested</span>
            </div>
            <p className="font-mono text-sm font-bold text-gray-900">{vault.totalInvested}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Investors</span>
            </div>
            <p className="font-mono text-sm font-bold text-gray-900">{vault.investors}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Avg. IRR</span>
            </div>
            <p className={`font-mono text-sm font-bold ${vault.accent}`}>{vault.avgIrr}</p>
          </div>
        </div>

        {/* CTA */}
        <Link
          to={vault.href}
          className={`w-full inline-flex items-center justify-center gap-2 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors bg-gradient-to-r ${vault.color} text-white hover:opacity-90 mt-auto`}
        >
          {vault.cta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Pillar Card                                                        */
/* ------------------------------------------------------------------ */

function PillarCard({ pillar, onPlayVideo }: { pillar: (typeof PILLARS)[number]; onPlayVideo: () => void }) {
  const Icon = pillar.icon

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${pillar.color} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${pillar.iconColor}`} />
        </div>
        <button
          onClick={onPlayVideo}
          className="relative group/tip shrink-0"
          aria-label={`Watch ${pillar.title} explainer video`}
        >
          <PlayCircle className="h-5 w-5 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer" />
          <span className="pointer-events-none absolute -bottom-8 right-0 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-[11px] text-white opacity-0 group-hover/tip:opacity-100 transition-opacity shadow-lg">
            Learn more
          </span>
        </button>
      </div>
      <h4 className="font-display text-base font-bold text-gray-900 mb-0.5">{pillar.title}</h4>
      <p className="text-xs font-medium text-gray-400 mb-2">{pillar.subtitle}</p>
      <p className="text-sm text-gray-600 leading-relaxed flex-1">{pillar.description}</p>
      <Link
        to={pillar.contributeHref}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
      >
        Contribute
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Quick-access nav links (replaces traditional navbar)                */
/* ------------------------------------------------------------------ */

const QUICK_LINKS = [
  { label: 'Portfolio', href: '/portfolio', icon: PieChart },
  { label: 'Community', href: '/community', icon: MessageCircle, roles: ['super_admin'] },
  { label: 'Onboard Company', href: '/company-onboarding', icon: Building2 },
  { label: 'Approvals', href: '/approvals', icon: ClipboardCheck, roles: ['admin', 'approver', 'super_admin'] },
  { label: 'Control Centre', href: '/control-centre', icon: Terminal, roles: ['super_admin'] },
] as const

export default function VaultsPage() {
  const [activeVideo, setActiveVideo] = useState<{ title: string; videoSrc: string } | null>(null)
  const [activePillarVideo, setActivePillarVideo] = useState<{ title: string; videoSrc: string } | null>(null)
  const [showCreateOpp, setShowCreateOpp] = useState(false)
  const { isSignedIn } = useUser()
  const userRole = useUserStore((s) => s.user?.role)

  const visibleLinks = QUICK_LINKS.filter((link) => {
    if (!('roles' in link)) return true
    return userRole && (link.roles as readonly string[]).includes(userRole)
  })

  return (
    <>
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Minimal top bar — logo + quick links + profile */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 flex h-16 items-center justify-between">
          <Link to="/vaults" className="flex items-center gap-2 shrink-0">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-display text-xl font-bold tracking-tight text-gray-900">
              Wealth<span className="text-primary">Spot</span>
            </span>
          </Link>

          {/* Quick nav */}
          <nav className="hidden md:flex items-center gap-6">
            {visibleLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-primary transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Create Opportunity + User */}
          <div className="flex items-center gap-3">
            {isSignedIn && (
              <button
                onClick={() => setShowCreateOpp(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors shadow-sm"
              >
                <Plus className="h-4 w-4" />
                Create Opportunity
              </button>
            )}
            <ProfileIndicator size="md" />
          </div>
        </div>

        {/* Mobile quick links — horizontal scroll */}
        <div className="md:hidden border-t border-gray-100 overflow-x-auto">
          <div className="flex items-center gap-1 px-4 py-2">
            {isSignedIn && (
              <button
                onClick={() => setShowCreateOpp(true)}
                className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-white bg-primary px-3 py-1.5 rounded-full"
              >
                <Plus className="h-3.5 w-3.5" />
                Create
              </button>
            )}
            {visibleLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-gray-500 hover:text-primary px-3 py-1.5 rounded-full hover:bg-primary/5 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Pick Your Arena 🏟️
          </h1>
          <p className="text-gray-500 max-w-2xl text-lg leading-relaxed">
            Three curated vaults — each designed for a different opportunity class. Pick the one that vibes with your goals and start stacking wealth today.
          </p>
        </div>
      </section>

      {/* Vaults Grid */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
          <div className="grid md:grid-cols-3 gap-8">
            {VAULTS.map((vault) => (
              <VaultCard
                key={vault.id}
                vault={vault}
                onPlayVideo={() => setActiveVideo({ title: vault.title, videoSrc: vault.videoSrc })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4 Investor Pillars — super_admin only */}
      {userRole === 'super_admin' && (
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">The Four Pillars</span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
              Every Investor Has Something Unique to Offer
            </h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
              At WealthSpot, investing isn't just about money. We recognise four types of investors — each contributing a different kind of capital to create outsized value together.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((pillar) => (
              <PillarCard
                key={pillar.title}
                pillar={pillar}
                onPlayVideo={() => setActivePillarVideo({ title: pillar.title, videoSrc: pillar.videoSrc })}
              />
            ))}
          </div>
        </div>
      </section>
      )}
    </div>

      {/* Vault intro video popup */}
      {activeVideo && (
        <VaultVideoPopup
          title={activeVideo.title}
          videoSrc={activeVideo.videoSrc}
          onClose={() => setActiveVideo(null)}
        />
      )}

      {/* Pillar explainer video popup */}
      {activePillarVideo && (
        <VaultVideoPopup
          title={activePillarVideo.title}
          videoSrc={activePillarVideo.videoSrc}
          onClose={() => setActivePillarVideo(null)}
        />
      )}

      {/* Create Opportunity modal */}
      <CreateOpportunityModal open={showCreateOpp} onClose={() => setShowCreateOpp(false)} />
    </>
  )
}
