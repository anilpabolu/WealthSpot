import { useState, useEffect, useRef, forwardRef } from 'react'
import { MainLayout } from '@/components/layout'
import OnboardingVideo from '@/components/OnboardingVideo'
import { usePlatformStats } from '@/hooks/usePlatformStats'
import {
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle2,
  Zap,
  IndianRupee,
  MapPin,
  BadgeCheck,
  Eye,
  Lightbulb,
} from 'lucide-react'


/* ---------- Helpers ---------- */
function formatINRCompact(n: number): string {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`
  return `₹${n}`
}

function AnimatedNumber({ value, format }: { value: number; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    if (!value) return
    let start = 0
    const duration = 1200
    const step = (ts: number) => {
      if (!startTs) startTs = ts
      const progress = Math.min((ts - startTs) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      start = Math.round(eased * value)
      setDisplay(start)
      if (progress < 1) requestAnimationFrame(step)
    }
    let startTs: number | null = null
    requestAnimationFrame(step)
  }, [value])
  return <>{format ? format(display) : display.toLocaleString('en-IN')}</>
}


/* ---------- Hero ---------- */
function HeroSection({ onRequestAccess, onExplore }: { onRequestAccess: () => void; onExplore: () => void }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-1 flex items-center">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Hero copy */}
          <div className="space-y-6">
            <span className="page-hero-badge">
              <Zap className="h-3.5 w-3.5 inline mr-1.5" />
              Curated access &bull; trusted networks &bull; strategic entry
            </span>
            <h1 className="font-hero text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
              Private Access to Exceptional Real Asset Opportunities.
            </h1>
            <p className="text-lg text-white/70 max-w-lg leading-relaxed font-body">
              A refined platform for discerning investors, strategic partners, and value creators
              seeking curated entry into early-stage real estate opportunities and relationship-led
              wealth creation.
            </p>
            <p className="text-[15px] text-white/50 italic max-w-lg leading-relaxed font-body">
              For those who understand that wealth is not built by chasing visibility, but by entering
              with clarity, conviction, and the right people around the table.
            </p>

            {/* CTA row */}
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={onRequestAccess} className="btn-gradient bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-base px-8 py-3.5 inline-flex items-center gap-2">
                Request Private Access
                <ArrowRight className="h-5 w-5" />
              </button>
              <button onClick={onExplore} className="px-8 py-3.5 text-base rounded-xl border border-white/20 text-white/80 hover:border-[#D4AF37]/40 hover:text-white transition-colors">
                Explore WealthSpot
              </button>
            </div>
          </div>

          {/* Right — Thesis panel */}
          <div className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/15 p-8 space-y-6">
            {/* Warm gradient bg */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1510] via-[#111827]/90 to-[#0f172a] rounded-2xl" />
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-t-2xl" />
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-[#D4AF37]/[0.04] blur-2xl pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">
                WealthSpot Thesis
              </p>
              <span className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest leading-tight text-center">
                Private<br />Market<br />Mindset
              </span>
            </div>

            <h2 className="relative z-10 font-hero text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
              Where access, judgment, and trust align.
            </h2>

            <hr className="relative z-10 border-white/10" />

            {/* Core Belief */}
            <div className="relative z-10 rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">Core Belief</p>
              <p className="text-sm text-white/70 leading-relaxed font-body">
                The best opportunities are often recognized early, understood deeply, and pursued
                selectively. WealthSpot is being built around that belief.
              </p>
            </div>

            {/* Platform Promise */}
            <div className="relative z-10 rounded-xl border border-white/10 bg-white/[0.04] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-2">Platform Promise</p>
              <p className="text-sm text-white/70 leading-relaxed font-body">
                We bring together curated deal flow, aligned investor communities, and future-facing
                participation models in one premium ecosystem.
              </p>
            </div>

            {/* Gold highlight */}
            <div className="relative z-10 rounded-xl border-2 border-[#D4AF37]/40 bg-[#D4AF37]/5 p-5">
              <p className="text-sm text-white/80 leading-relaxed font-body">
                The result is a platform that feels less like a listing portal and more like
                a private gateway into quality opportunity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Platform Stats ---------- */
function StatsBar() {
  const { data } = usePlatformStats()

  const stats = [
    { label: 'Platform Members', icon: Users, value: data?.totalMembers ?? 0 },
    { label: 'Capital Deployed', icon: IndianRupee, value: data?.capitalDeployed ?? 0, fmt: formatINRCompact },
    { label: 'Live Opportunities', icon: TrendingUp, value: data?.activeOpportunities ?? 0 },
    { label: 'Markets Covered', icon: MapPin, value: data?.marketsCovered ?? 0 },
    { label: 'Verified Investors', icon: BadgeCheck, value: data?.verifiedInvestors ?? 0 },
  ]

  return (
    <section className="bg-white border-y border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="stat-card-icon bg-primary/10 shrink-0">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <p className="font-mono text-lg font-bold text-gray-900">
                  <AnimatedNumber value={s.value} format={s.fmt} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Closing Section (Why Investors + CTA) ---------- */
function ClosingSection({ onRequestAccess, onReviewVaults }: { onRequestAccess: () => void; onReviewVaults: () => void }) {
  const cards = [
    {
      icon: Eye,
      title: 'Why Affluent Investors Relate',
      points: [
        'Access to quality deal flow — not noise',
        'Strong filters for who can participate',
        'Alignment of values, intent & expertise',
        'Built for those who invest with conviction',
      ],
    },
    {
      icon: Lightbulb,
      title: 'Knowledge and Credibility',
      points: [
        'Conviction begins with clarity',
        'Due-diligence reports on every opportunity',
        'Transparent financials, timelines & risk ratings',
        'Educational content on asset-class strategy',
      ],
    },
  ]

  return (
    <section className="py-16 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/30 p-10 sm:p-14">
          {/* Gradient bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1510] via-slate-900/90 to-slate-900 rounded-2xl" />
          {/* Shine overlay */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-t-2xl" />
          {/* Ambient glow */}
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[#D4AF37]/5 blur-3xl pointer-events-none" />

          {/* WhyInvestors tiles */}
          <div className="relative z-10 grid md:grid-cols-2 gap-6">
            {cards.map((c) => (
              <div key={c.title} className="rounded-xl border border-white/10 bg-white/[0.04] p-8">
                <div className="flex items-center gap-2 mb-5">
                  <c.icon className="h-5 w-5 text-[#D4AF37]" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">{c.title}</h3>
                </div>
                <ul className="space-y-3">
                  {c.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm text-white/70 leading-relaxed font-body">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="relative z-10 border-t border-white/10 my-10" />

          {/* CTA content */}
          <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-10 items-center">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37]">Closing CTA</p>
              <h2 className="font-hero text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-[1.2] tracking-tight">
                Where access, judgment, and trust align,{' '}
                <br className="hidden sm:block" />
                wealth has a better place to grow.
              </h2>
              <p className="text-[15px] text-white/60 leading-relaxed font-body max-w-xl">
                WealthSpot is being created for those who prefer meaningful entry, selective
                opportunities, and relationships that compound beyond capital alone.
              </p>
              <div className="w-12 h-px bg-[#D4AF37]/50" />
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]/70 leading-relaxed">
                For investors, partners, and contributors who take<br />
                opportunity seriously.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={onRequestAccess}
                className="btn-gradient bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-8 py-3 text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
              >
                Request Access
              </button>
              <button
                onClick={onReviewVaults}
                className="px-8 py-3 text-sm rounded-2xl border border-white/20 text-white/80 hover:border-[#D4AF37]/40 hover:text-white transition-colors whitespace-nowrap"
              >
                Review the Vaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Intro ---------- */
function IntroSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-indigo-500/8 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left — Label + Heading */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37] mb-6">Intro</p>
            <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-[1.15] tracking-tight">
              Built for those who think beyond conventional investing.
            </h2>
          </div>
          {/* Right — Body paragraphs */}
          <div className="space-y-6">
            <p className="text-[15px] text-white/70 leading-relaxed font-body">
              WealthSpot is built for individuals who value access over noise, curation over clutter,
              and long-term positioning over short-term excitement.
            </p>
            <p className="text-[15px] text-white/70 leading-relaxed font-body">
              At its core, WealthSpot opens access to select real estate opportunities at earlier
              stages of value creation, where strategic entry, intrinsic value, and disciplined
              participation matter most.
            </p>
            <p className="text-[15px] text-white/70 leading-relaxed font-body">
              This is not a marketplace for everyone. It is a platform for serious participation,
              trusted relationships, and intelligent wealth-building through capital, capability,
              and connections.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- The Vaults ---------- */
const TheVaultsSection = forwardRef<HTMLElement>(function TheVaultsSection(_, ref) {
  const vaults = [
    {
      badge: 'Flagship',
      badgeColor: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
      number: '01',
      title: 'Wealth Vault',
      body: 'A premium gateway to curated real estate opportunities positioned around intrinsic value, timing, and long-term appreciation potential.',
      italic: 'Designed for investors who believe disciplined entry can shape exceptional outcomes.',
    },
    {
      badge: 'Collaborative',
      badgeColor: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
      number: '02',
      title: 'Community Vault',
      body: 'A trusted environment where co-investors, co-partners, and execution-led collaborators can align around opportunity.',
      italic: 'It exists to help serious people find one another, structure participation intelligently, and move from interest to closure with confidence.',
    },
    {
      badge: 'Coming Soon',
      badgeColor: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
      number: '03',
      title: 'Opportunity Vault',
      body: 'A future-focused layer for those who contribute more than money alone.',
      italic: 'It is being designed for participants who bring expertise, time, strategic guidance, or influential networks into emerging opportunities.',
    },
  ]

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37] mb-5">The Vaults</p>
        <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-[1.15] tracking-tight mb-12">
          Three distinct entry points into the{' '}
          <br className="hidden lg:block" />
          WealthSpot ecosystem.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((v) => (
            <div
              key={v.title}
              className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/15 p-7 hover:border-[#D4AF37]/30 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1510] via-[#111827]/90 to-[#0f172a] rounded-2xl" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-t-2xl" />
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#D4AF37]/[0.04] blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${v.badgeColor}`}>
                    {v.badge}
                  </span>
                  <span className="text-white/20 font-mono text-sm">{v.number}</span>
                </div>
                <h3 className="font-hero text-xl font-bold text-white mb-4">{v.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed font-body mb-4">{v.body}</p>
                <p className="text-sm text-white/40 italic leading-relaxed font-body">{v.italic}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})

/* ---------- Investor Identities ---------- */
function InvestorIdentitiesSection() {
  const identities = [
    {
      title: 'Money Investor',
      badge: 'Capital',
      body: 'Deploy capital into select opportunities with a clear investment thesis and a disciplined entry mindset.',
      italic: 'Ideal for those who seek real asset exposure with strategic alignment and stronger filters.',
    },
    {
      title: 'Time Investor',
      badge: 'Capability',
      body: 'Contribute expertise, leadership, execution, or oversight where active involvement creates real value.',
      italic: 'This path recognizes that serious experience can be as meaningful as capital in the right opportunity.',
    },
    {
      title: 'Network Investor',
      badge: 'Connections',
      body: 'Open doors through trusted relationships.',
      italic: 'Whether by introducing co-investors, customers, suppliers, or strategic enablers, your network becomes a genuine form of investment.',
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-indigo-500/8 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37] mb-5">Investor Identities</p>
        <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-white leading-[1.15] tracking-tight mb-12">
          Three ways to participate in value{' '}
          <br className="hidden lg:block" />
          creation.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {identities.map((id) => (
            <div
              key={id.title}
              className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/15 p-7 hover:border-[#D4AF37]/30 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1510] via-[#111827]/90 to-[#0f172a] rounded-2xl" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-t-2xl" />
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#D4AF37]/[0.04] blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-hero text-lg font-bold text-white">{id.title}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">{id.badge}</span>
                </div>
                <p className="text-sm text-white/60 leading-relaxed font-body mb-4">{id.body}</p>
                <p className="text-sm text-white/40 italic leading-relaxed font-body">{id.italic}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}



/* ---------- Landing Page ---------- */
export default function LandingPage() {
  const [showVideo, setShowVideo] = useState(false)
  const [videoMode, setVideoMode] = useState<'browse' | 'signup'>('browse')
  const vaultsRef = useRef<HTMLElement>(null)

  const openVideo = (mode: 'browse' | 'signup') => {
    setVideoMode(mode)
    setShowVideo(true)
  }

  const scrollToVaults = () => {
    vaultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <MainLayout>
      {/* Hero (2-col with thesis) + metrics fill one viewport */}
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <HeroSection onRequestAccess={() => openVideo('signup')} onExplore={() => openVideo('browse')} />
        <StatsBar />
      </div>
      <IntroSection />
      <TheVaultsSection ref={vaultsRef} />
      <InvestorIdentitiesSection />
      <ClosingSection onRequestAccess={() => openVideo('signup')} onReviewVaults={scrollToVaults} />

      {/* Video overlay */}
      {showVideo && (
        <OnboardingVideo
          mode={videoMode}
          onComplete={() => setShowVideo(false)}
          onClose={() => setShowVideo(false)}
        />
      )}
    </MainLayout>
  )
}
