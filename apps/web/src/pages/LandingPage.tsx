import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout'
import OnboardingVideo from '@/components/OnboardingVideo'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { useContent } from '@/hooks/useSiteContent'
import { usePublicImage } from '@/hooks/useAppImages'
import { useClerk } from '@clerk/react'
import ParticleCanvas from '@/components/ui/ParticleCanvas'
import GradientMesh from '@/components/ui/GradientMesh'
import SEOHead from '@/components/SEOHead'
import {
  ArrowRight,
  Zap,
} from 'lucide-react'



/* ---------- Hero Image Showcase ---------- */
const DEFAULT_HERO_IMAGE = '/wealthspot-investment-journey.png'
const DEFAULT_HERO_ALT = 'WealthSpot investment journey from opportunity discovery to deal closure'

function HeroImageShowcase() {
  const { data: managedHero } = usePublicImage('home', 'hero_image')
  const [imgError, setImgError] = useState(false)
  const imageSrc = managedHero?.imageUrl || DEFAULT_HERO_IMAGE
  const imageAlt = managedHero?.altText || DEFAULT_HERO_ALT

  useEffect(() => {
    setImgError(false)
  }, [imageSrc])

  return (
    <div className="relative w-full animate-float lg:scale-[1.04] xl:scale-[1.08]">
      {!imgError && (
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-4 -z-10 h-[calc(100%-2rem)] w-[calc(100%-2rem)] rounded-[2rem] object-cover opacity-20 blur-2xl saturate-125"
        />
      )}
      <div className="absolute -inset-5 -z-10 rounded-[2rem] bg-gradient-to-br from-[#D4AF37]/18 via-indigo-500/10 to-transparent blur-2xl" />

      <div
        className="rounded-[2rem] border border-[#D4AF37]/70 bg-gradient-to-br from-[#FFF7B8]/70 via-[#D4AF37]/60 to-[#7A5512]/80 p-[3px]"
        style={{
          boxShadow:
            '0 0 70px rgba(212,175,55,0.24), 0 28px 90px rgba(2,6,23,0.45), inset 0 0 24px rgba(212,175,55,0.08)',
        }}
      >
        <div className="rounded-[1.75rem] bg-slate-950/95 p-[5px]">
          <div className="relative overflow-hidden rounded-[1.45rem] border border-[#D4AF37]/35 bg-white">
            <div className="absolute inset-0 pointer-events-none rounded-[1.45rem] ring-1 ring-inset ring-white/40" />
            {imgError ? (
              <div className="aspect-[16/9] bg-gradient-to-br from-[#0b1120] via-[#111827] to-[#1a1510] flex flex-col items-center justify-center gap-5 p-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#D4AF37]/70">Investment Journey</p>
                <p className="font-hero text-4xl sm:text-5xl font-extrabold text-white tracking-tight text-center leading-tight">
                  WealthSpot<br />Investment Journey
                </p>
                <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent rounded-full" />
                <p className="text-white/40 text-xs text-center font-body leading-relaxed">
                  Upload or replace the home hero image from Command & Control.
                </p>
              </div>
            ) : (
              <img
                src={imageSrc}
                alt={imageAlt}
                className="aspect-[16/9] w-full object-contain block"
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Hero ---------- */
function HeroSection() {
  const heroBadge = useContent('landing', 'hero_badge', 'Curated access • trusted networks • strategic entry')
  const heroTitle = useContent('landing', 'hero_title', 'Private Access to Exceptional Real Asset Opportunities.')
  const heroSubtitle = useContent('landing', 'hero_subtitle', 'A refined platform for discerning investors, strategic partners, and value creators seeking curated entry into early-stage real estate opportunities and relationship-led wealth creation.')
  const heroItalic = useContent('landing', 'hero_italic', 'For those who understand that wealth is not built by chasing visibility, but by entering with clarity, conviction, and the right people around the table.')

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-1 flex items-center">
      {/* Particle + Gradient overlays */}
      <ParticleCanvas className="opacity-60" />
      <GradientMesh />
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl" />
      </div>
      <div className="mx-auto w-full max-w-[100rem] px-6 sm:px-8 lg:px-12 xl:px-14 relative z-10">
        <div className="grid lg:grid-cols-[0.68fr_1.56fr] gap-10 lg:gap-10 xl:gap-12 items-center">
          {/* Left — Hero copy */}
          <div className="space-y-6">
            <span className="page-hero-badge animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <Zap className="h-3.5 w-3.5 inline mr-1.5" />
              {heroBadge}
            </span>
            <h1 className="font-hero text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight animate-fade-up" style={{ animationDelay: '0.2s' }}>
              {heroTitle}
            </h1>
            <p className="text-lg text-white/70 max-w-lg leading-relaxed font-body animate-fade-up" style={{ animationDelay: '0.3s' }}>
              {heroSubtitle}
            </p>
            <p className="text-[15px] text-white/50 italic max-w-lg leading-relaxed font-body">
              {heroItalic}
            </p>
          </div>

          {/* Right — Admin-managed home hero image with gold double-border */}
          <HeroImageShowcase />
        </div>
      </div>
    </section>
  )
}

/* ---------- Closing CTA ---------- */
function ClosingSection({ onRequestAccess }: { onRequestAccess: () => void }) {
  const closingHeading = useContent('landing', 'closing_heading', 'Where access, judgment, and trust align, wealth has a better place to grow.')
  const closingBody = useContent('landing', 'closing_body', 'WealthSpot is being created for those who prefer meaningful entry, selective opportunities, and relationships that compound beyond capital alone.')
  const closingCta1 = useContent('landing', 'closing_cta_1', 'Request Access')

  return (
    <section className="py-20 content-section-bg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-indigo-500/8 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37] mb-5">Closing CTA</p>
        <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-theme-primary leading-[1.15] tracking-tight mb-6">
          {closingHeading}
        </h2>
        <p className="text-[15px] text-theme-secondary leading-relaxed font-body max-w-xl mb-8">
          {closingBody}
        </p>
        <div className="w-12 h-px bg-[#D4AF37]/50 mb-6" />
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]/70 leading-relaxed mb-8">
          For investors, partners, and contributors who take<br />
          opportunity seriously.
        </p>
        <button
          onClick={onRequestAccess}
          className="btn-gradient bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-8 py-3.5 text-sm inline-flex items-center justify-center gap-2"
        >
          {closingCta1}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

/* ---------- Intro ---------- */
function IntroSection() {
  const introLabel = useContent('landing', 'intro_label', 'Intro')
  const introHeading = useContent('landing', 'intro_heading', 'Built for those who think beyond conventional investing.')
  const introBody1 = useContent('landing', 'intro_body_1', 'WealthSpot is built for individuals who value access over noise, curation over clutter, and long-term positioning over short-term excitement.')
  const introBody2 = useContent('landing', 'intro_body_2', 'At its core, WealthSpot opens access to select real estate opportunities at earlier stages of value creation, where strategic entry, intrinsic value, and disciplined participation matter most.')

  return (
    <section className="py-20 content-section-bg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-indigo-500/8 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left — Label + Heading */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37] mb-6">{introLabel}</p>
            <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-theme-primary leading-[1.15] tracking-tight">
              {introHeading}
            </h2>
          </div>
          {/* Right — Body paragraphs */}
          <div className="space-y-6">
            <p className="text-[15px] text-theme-secondary leading-relaxed font-body">
              {introBody1}
            </p>
            <p className="text-[15px] text-theme-secondary leading-relaxed font-body">
              {introBody2}
            </p>
            <p className="text-[15px] text-theme-secondary leading-relaxed font-body">
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
function TheVaultsSection() {
  const vaultsLabel = useContent('landing', 'vaults_label', 'The Vaults')
  const vaultsHeading = useContent('landing', 'vaults_heading', 'Three distinct entry points into the WealthSpot ecosystem.')

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
      title: 'Safe Vault',
      body: 'A fixed-return layer for those who want predictable income backed by real assets.',
      italic: 'It is being designed for participants who prefer mortgage-backed security, structured payouts, and lower-volatility opportunities.',
    },
  ]

  return (
    <section className="py-20 content-section-bg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37] mb-5">{vaultsLabel}</p>
        <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-theme-primary leading-[1.15] tracking-tight mb-12">
          {vaultsHeading}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vaults.map((v) => (
            <div
              key={v.title}
              className="relative overflow-hidden rounded-2xl border border-[var(--frame-border)] p-7 hover:border-[var(--frame-border-hover)] transition-colors"
            >
              <div className="absolute inset-0 content-card-bg rounded-2xl" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-t-2xl" />
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#D4AF37]/[0.04] blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${v.badgeColor}`}>
                    {v.badge}
                  </span>
                  <span className="text-theme-tertiary font-mono text-sm">{v.number}</span>
                </div>
                <h3 className="font-hero text-xl font-bold text-theme-primary mb-4">{v.title}</h3>
                <p className="text-sm text-theme-secondary leading-relaxed font-body mb-4">{v.body}</p>
                <p className="text-sm text-theme-tertiary italic leading-relaxed font-body">{v.italic}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Investor Identities ---------- */
function InvestorIdentitiesSection() {
  const identitiesLabel = useContent('landing', 'identities_label', 'Investor Identities')
  const identitiesHeading = useContent('landing', 'identities_heading', 'Three ways to participate in value creation.')

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
    <section className="py-20 content-section-bg relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-indigo-500/8 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#D4AF37] mb-5">{identitiesLabel}</p>
        <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-theme-primary leading-[1.15] tracking-tight mb-12">
          {identitiesHeading}
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {identities.map((id) => (
            <div
              key={id.title}
              className="relative overflow-hidden rounded-2xl border border-[var(--frame-border)] p-7 hover:border-[var(--frame-border-hover)] transition-colors"
            >
              <div className="absolute inset-0 content-card-bg rounded-2xl" />
              <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.06] to-transparent pointer-events-none rounded-t-2xl" />
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#D4AF37]/[0.04] blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-hero text-lg font-bold text-theme-primary">{id.title}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-theme-tertiary">{id.badge}</span>
                </div>
                <p className="text-sm text-theme-secondary leading-relaxed font-body mb-4">{id.body}</p>
                <p className="text-sm text-theme-tertiary italic leading-relaxed font-body">{id.italic}</p>
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
  const { introVideosEnabled } = useVaultConfig()
  const clerk = useClerk()

  const openVideo = (mode: 'browse' | 'signup') => {
    if (!introVideosEnabled) {
      clerk.openSignUp({ forceRedirectUrl: '/vaults' })
      return
    }
    setVideoMode(mode)
    setShowVideo(true)
  }

  return (
    <MainLayout>
      <SEOHead
        title="Democratizing Premium Assets"
        description="Invest in premium real estate fractionally starting from ₹10,000. Wealth Vault, Safe Vault, and Community Vault on WealthSpot."
        path="/"
      />
      <HeroSection />
      <IntroSection />
      <TheVaultsSection />
      <InvestorIdentitiesSection />
      <ClosingSection onRequestAccess={() => openVideo('signup')} />

      {/* Video overlay */}
      {introVideosEnabled && showVideo && (
        <OnboardingVideo
          mode={videoMode}
          onComplete={() => setShowVideo(false)}
          onClose={() => setShowVideo(false)}
        />
      )}
    </MainLayout>
  )
}
