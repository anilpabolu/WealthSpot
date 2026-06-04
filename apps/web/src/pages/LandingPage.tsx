import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { MainLayout } from '@/components/layout'
import { useContent } from '@/hooks/useSiteContent'
import { useClerk } from '@clerk/react'
import { usePublicVideo } from '@/hooks/useAppVideos'
import SEOHead from '@/components/SEOHead'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import JourneyConstellation from '@/components/landing/JourneyConstellation'

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SHARED TYPE
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
interface WithRequestAccess {
  onRequestAccess: () => void
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SECTION 1 â€” HERO
   Full-viewport video background, text anchored bottom-right
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function HeroSection({ onRequestAccess }: WithRequestAccess) {
  const headline1a  = useContent('landing', 'hero_headline_1a', 'Invest together in')
  const headline1b  = useContent('landing', 'hero_headline_1b', 'curated opportunities.')
  const heroSub     = useContent('landing', 'hero_sub', 'A Digital Discovery Platform To Find Assets At Intrinsic Value')
  const heroCta     = useContent('landing', 'hero_cta', 'Request Access')
  const heroLink    = useContent('landing', 'hero_link', 'Learn how it works')
  const defaultVideoUrl = useContent('landing', 'hero_video_url', 'https://videos.ctfassets.net/9x3tafuqbgo7/01mmgjnzqBUgPEllSYW8a0/ddb34bd8b12922f0be54332c2313af69/Crowd_Street_1920x960_01-v1-.mp4')
  const { data: heroVideo } = usePublicVideo('home', 'hero_video')
  const heroVideoUrl = heroVideo?.videoUrl || defaultVideoUrl

  return (
    <section
      id="hero"
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
    >
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="https://framerusercontent.com/images/HvtS6jxxVUt8hghleColt8SgQ8.jpg?width=1440&height=720"
        className="absolute inset-0 h-full w-full object-cover"
        src={heroVideoUrl}
      />

      {/* Gradient overlay â€” transparent top, dark bottom for text legibility */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(120deg, rgba(6,34,36,0.55) 0%, rgba(6,34,36,0.15) 45%, rgba(0,0,0,0.4) 100%)' }}
      />


      {/* Content â€” left-aligned, anchored lower-left */}
      <div className="relative z-10 mt-auto w-full">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 pb-16 lg:pb-20">
          <div className="flex flex-col items-end text-right max-w-2xl ml-auto">

            {/* headline */}
            <h1 className="font-hero">
              <span className="block leading-[1.08] tracking-tight text-white text-[2.6rem] sm:text-5xl lg:text-[4rem] xl:text-[4.35rem] font-semibold" style={{ textShadow: '0 6px 24px rgba(0,0,0,0.45)' }}>
                {headline1a}
              </span>
              <span className="block leading-[1.08] tracking-tight text-[#D4AF37] text-[2.6rem] sm:text-5xl lg:text-[4rem] xl:text-[4.35rem] font-semibold" style={{ textShadow: '0 6px 24px rgba(0,0,0,0.45)' }}>
                {headline1b}
              </span>
            </h1>

            {/* sub */}
            <p className="mt-5 font-body text-[1.02rem] sm:text-lg text-[#F3E5BB] leading-relaxed max-w-md" style={{ textShadow: '0 4px 18px rgba(0,0,0,0.55)' }}>
              {heroSub}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-end sm:items-center justify-end gap-4 sm:gap-6">
              <button
                onClick={onRequestAccess}
                className="inline-flex items-center gap-2.5 rounded-[14px] bg-[#74E6D6] px-8 py-3.5 font-body text-[15px] font-semibold text-[#0A3D3A] transition-all duration-200 hover:bg-[#67D7C8] hover:scale-[1.03] active:scale-100"
              >
                {heroCta}
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#for-me"
                className="inline-flex items-center gap-2 font-body text-[14px] font-medium text-white/65 transition-colors hover:text-white pb-1"
              >
                {heroLink}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SECTION 3 â€” INVESTMENT JOURNEY
   Full-width infographic image with overlaid graphics
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ForMeSection(_: WithRequestAccess) {
  return (
    <section
      id="for-me"
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: '#ffffff' }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 -left-24 w-[420px] h-[420px] rounded-full bg-[#D4AF37]/5 blur-[130px]" />
        <div className="absolute bottom-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-indigo-500/7 blur-[130px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-[#D4AF37]/4 blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">

        {/* Section heading */}
        <div className="text-center mb-12">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">The Journey</p>
          <h2 className="font-hero text-3xl sm:text-4xl font-bold text-slate-900 leading-[1.12] tracking-tight">
            Your investment journey, simplified.
          </h2>
        </div>

        <JourneyConstellation />
      </div>
    </section>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SECTION â€” INVESTOR IDENTITIES
   Four ways to participate in value creation.
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const INVESTOR_PILLARS = [
  {
    number: '01',
    category: 'CAPITAL',
    title: 'Money Investor',
    body: 'Deploy capital into select opportunities with a clear investment thesis and a disciplined entry mindset.',
    italic: 'Ideal for those who seek real asset exposure with strategic alignment and stronger filters.',
    tag: 'Most Common',
  },
  {
    number: '02',
    category: 'CAPABILITY',
    title: 'Time Investor',
    body: 'Contribute expertise, leadership, execution, or oversight where active involvement creates real value.',
    italic: 'This path recognises that serious experience can be as meaningful as capital in the right opportunity.',
    tag: null,
  },
  {
    number: '03',
    category: 'CONNECTIONS',
    title: 'Network Investor',
    body: 'Open doors through trusted relationships. Introduce co-investors, customers, suppliers, or strategic enablers.',
    italic: 'Your network becomes a genuine form of investment — and earns accordingly.',
    tag: null,
  },
  {
    number: '04',
    category: 'KNOWLEDGE',
    title: 'Education Investor',
    body: 'Share domain expertise, conduct workshops, or provide strategic advisory. Help ventures succeed through what you know.',
    italic: 'The rarest form of capital. Your insights become equity in the ventures that need them most.',
    tag: 'Rarest',
  },
]

function InvestorIdentitiesSection() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section
      id="investor-identities"
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: '#ffffff' }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-[500px] h-[500px] rounded-full bg-[#D4AF37]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-violet-400/8 blur-[100px]" />
        <div className="absolute top-1/2 -left-20 w-64 h-64 rounded-full bg-emerald-400/6 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14 sm:mb-16">
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#B8941F]">Investor Identities</p>
            <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-slate-900 leading-[1.12] tracking-tight max-w-lg">
              Four ways to participate in value creation.
            </h2>
          </div>
          <p className="font-body text-[14px] text-slate-500 leading-relaxed max-w-xs sm:text-right">
            Capital is one lens. WealthSpot recognises three others — each just as legitimate.
          </p>
        </div>

        {/* Single-line stackable tile row */}
        <div className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] gap-5 lg:gap-6 overflow-x-auto pb-3 [scrollbar-width:thin] [scrollbar-color:#4d3a7a_transparent] lg:grid-flow-row lg:grid-cols-4 lg:auto-cols-auto lg:overflow-x-visible">
          {INVESTOR_PILLARS.map((pillar, i) => {
            const isHovered = hovered === i
            return (
              <div
                key={pillar.number}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="group relative rounded-2xl overflow-hidden cursor-default transition-transform duration-300 min-h-[360px]"
                style={{
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  background: 'linear-gradient(160deg, #2A1753 0%, #1F1243 55%, #160C34 100%)',
                  border: `1px solid ${isHovered ? 'rgba(210,191,245,0.55)' : 'rgba(180,151,235,0.35)'}`,
                  boxShadow: isHovered ? '0 10px 26px rgba(22,12,52,0.45)' : '0 6px 18px rgba(22,12,52,0.35)',
                  transition: 'transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease',
                }}
              >
                <div className="relative p-7 sm:p-8">
                  {/* Top row: category + optional tag */}
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.22em]"
                      style={{ color: '#CDBFF4' }}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: '#CDBFF4' }}
                      />
                      {pillar.category}
                    </span>
                    {pillar.tag && (
                      <span
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{
                          background: 'rgba(205,191,244,0.12)',
                          color: '#CDBFF4',
                          border: '1px solid rgba(205,191,244,0.35)',
                        }}
                      >
                        {pillar.tag}
                      </span>
                    )}
                  </div>

                  {/* Accent rule â€” expands on hover */}
                  <div
                    className="mb-5 h-px rounded-full"
                    style={{
                      background: 'linear-gradient(90deg, #CDBFF4, transparent)',
                      width: isHovered ? '80px' : '40px',
                      transition: 'width 300ms ease',
                    }}
                  />

                  {/* Title */}
                  <h3 className="font-hero text-xl sm:text-2xl font-bold text-[#F8F5FF] mb-3 leading-snug">
                    {pillar.title}
                  </h3>

                  {/* Body */}
                  <p className="font-body text-[14px] text-[#F8F5FF]/90 leading-relaxed mb-4">
                    {pillar.body}
                  </p>

                  {/* Italic note */}
                  <p
                    className="font-body text-[13px] italic leading-relaxed"
                    style={{ color: '#CDBFF4' }}
                  >
                    {pillar.italic}
                  </p>
                </div>
              </div>
            )
          })}
        </div>


      </div>
    </section>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SECTION 4 â€” VAULT IMAGE TILES
   "The Vaults" â€” 3 full-bleed image cards
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const VAULT_GAP  = 28   // px gap between cards
const VAULT_PEEK = 88   // px of the next card peeking from the right

function VaultCardsSection(_: WithRequestAccess) {
  const overline = useContent('landing', 'vaults_overline', 'The Vaults')
  const heading  = useContent('landing', 'vaults_heading', 'Three distinct entry points into the WealthSpot ecosystem.')

  const vaults = [
    {
      image:  useContent('landing', 'vault_1_image', '/images/vault-wealth.jpg'),
      badge:  'Flagship' as const,
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' as const,
      title:  useContent('landing', 'vault_1_title', 'Wealth Vault'),
      body:   useContent('landing', 'vault_1_body', 'A premium gateway to curated real estate opportunities positioned around intrinsic value, timing, and long-term appreciation potential.'),
      italic: useContent('landing', 'vault_1_italic', 'Designed for investors who believe disciplined entry can shape exceptional outcomes.'),
      locked: false,
    },
    {
      image:  useContent('landing', 'vault_3_image', '/images/vault-safe.jpg'),
      badge:  'Coming Soon' as const,
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/30' as const,
      title:  useContent('landing', 'vault_3_title', 'Safe Vault'),
      body:   useContent('landing', 'vault_3_body', 'A fixed-return layer for those who want predictable income backed by real assets.'),
      italic: useContent('landing', 'vault_3_italic', 'Being designed for participants who prefer mortgage-backed security, structured payouts, and lower-volatility opportunities.'),
      locked: true,
    },
    {
      image:  useContent('landing', 'vault_2_image', '/images/vault-community.jpg'),
      badge:  'Collaborative' as const,
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' as const,
      title:  useContent('landing', 'vault_2_title', 'Community Vault'),
      body:   useContent('landing', 'vault_2_body', 'A trusted environment where co-investors, co-partners, and execution-led collaborators can align around opportunity.'),
      italic: useContent('landing', 'vault_2_italic', 'It exists to help serious people find one another, structure participation intelligently, and move from interest to closure with confidence.'),
      locked: false,
    },
  ]

  const maxIndex = vaults.length - 1   // 1 card visible at a time
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const clipperRef = useRef<HTMLDivElement>(null)
  const [cardWidth, setCardWidth] = useState(0)

  // Measure carousel column width â†’ card = column - peek - gap
  useLayoutEffect(() => {
    const el = clipperRef.current
    if (!el) return
    const measure = () => setCardWidth(el.clientWidth - VAULT_PEEK - VAULT_GAP)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Auto-advance the vault carousel in a loop.
  useEffect(() => {
    if (isPaused) return
    const interval = window.setInterval(() => {
      setActiveIndex((i) => (i >= maxIndex ? 0 : i + 1))
    }, 4200)
    return () => window.clearInterval(interval)
  }, [isPaused, maxIndex])

  const translateX = -(activeIndex * (cardWidth + VAULT_GAP))

  return (
    <section
      id="vaults"
      className="relative z-20 py-20 sm:py-24"
      style={{ background: '#ffffff' }}
    >
      <div className="mx-[5%] lg:mx-[10%] rounded-3xl bg-white px-6 sm:px-8 lg:px-12 py-8 sm:py-10 shadow-[0_18px_40px_rgba(22,28,45,0.16)]">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-10 lg:gap-16 items-start">

          {/* LEFT â€” overline + heading + arrows */}
          <div className="flex flex-col">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">{overline}</p>
            <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-slate-900 leading-[1.12] tracking-tight">
              {heading}
            </h2>

            {/* Arrows sit below heading */}
            <div className="flex items-center gap-2 mt-10 lg:mt-auto lg:pt-12">
              <button
                aria-label="Previous vault"
                onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
                disabled={activeIndex === 0}
                className="flex items-center justify-center w-11 h-11 rounded-full border border-slate-300 text-slate-600 transition-all hover:border-[#D4AF37]/70 hover:text-[#D4AF37] disabled:opacity-25 disabled:cursor-default"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Next vault"
                onClick={() => setActiveIndex(i => Math.min(maxIndex, i + 1))}
                disabled={activeIndex >= maxIndex}
                className="flex items-center justify-center w-11 h-11 rounded-full border border-slate-300 text-slate-600 transition-all hover:border-[#D4AF37]/70 hover:text-[#D4AF37] disabled:opacity-25 disabled:cursor-default"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              {/* dot indicators */}
              <div className="flex items-center gap-1.5 ml-4">
                {vaults.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === activeIndex ? 'w-6 bg-[#D4AF37]' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to vault ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT â€” overflow-clipped carousel, 1 card + peek */}
          <div
            ref={clipperRef}
            style={{ overflow: 'hidden', position: 'relative' }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              style={{
                display: 'flex',
                gap: `${VAULT_GAP}px`,
                transform: `translateX(${translateX}px)`,
                transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
                userSelect: 'none',
              }}
            >
              {vaults.map((vault, i) => {
                const isActive = i === activeIndex
                return (
                  <div
                    key={vault.title}
                    style={{
                      flex: `0 0 ${cardWidth}px`,
                      opacity: isActive ? 1 : 0.45,
                      transition: 'opacity 0.55s ease',
                    }}
                    className="group flex flex-col"
                  >
                    {/* Large image with overlay */}
                    <div className="relative overflow-hidden rounded-2xl" style={{ height: '420px' }}>
                      <img
                        src={vault.image}
                        alt={vault.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      {/* gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                      {/* badge â€” top left */}
                      <div className="absolute top-5 left-5">
                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${vault.badgeStyle}`}>
                          {vault.badge}
                        </span>
                      </div>

                      {/* vault name â€” bottom left */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="font-hero text-2xl font-bold text-white leading-tight">
                          {vault.title}
                        </h3>
                      </div>
                    </div>

                    {/* Text below image */}
                    <div className="pt-5 pb-2 flex flex-col gap-3">
                      <p className="font-body text-[14px] text-white/65 leading-relaxed">{vault.body}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   SECTION 8 â€” CLOSING CTA
   "Get direct access to curated investments."
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function ClosingSection({ onRequestAccess }: WithRequestAccess) {
  const heading = useContent('landing', 'closing_heading', 'Get direct access to curated investments.')
  const body    = useContent('landing', 'closing_body', 'WealthSpot is being built for those who prefer meaningful entry, selective opportunities, and relationships that compound beyond capital alone.')
  const cta     = useContent('landing', 'closing_cta_1', 'Request Access')

  return (
    <section
      id="closing"
      className="relative overflow-hidden py-24 sm:py-32"
      style={{ background: '#ffffff' }}
    >
      {/* decorative glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#D4AF37]/6 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-600/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8 text-center">
        <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">Join WealthSpot</p>
        <h2 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-[1.1] tracking-tight mb-8">
          {heading}
        </h2>
        <p className="font-body text-[15px] text-slate-700 leading-relaxed max-w-xl mx-auto mb-12">
          {body}
        </p>
        <button
          onClick={onRequestAccess}
          className="inline-flex items-center gap-2.5 rounded-full bg-[#D4AF37] px-10 py-4 font-body text-[15px] font-bold text-slate-900 shadow-[0_0_40px_rgba(212,175,55,0.25)] transition-all duration-300 hover:brightness-110 hover:scale-[1.03] active:scale-100"
        >
          {cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   PAGE EXPORT
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export default function LandingPage() {
  const clerk = useClerk()

  const openVideo = (_mode: 'browse' | 'signup') => {
    clerk.openSignUp({ forceRedirectUrl: '/vaults' })
  }

  return (
    <MainLayout>
      <SEOHead
        title="Democratizing Premium Assets"
        description="Invest in premium real estate fractionally. Wealth Vault, Safe Vault, and Community Vault on WealthSpot — curated opportunities for serious investors."
        path="/"
      />

      <HeroSection       onRequestAccess={() => openVideo('signup')} />
      <VaultCardsSection onRequestAccess={() => openVideo('signup')} />
      <InvestorIdentitiesSection />
      <ForMeSection      onRequestAccess={() => openVideo('browse')} />
      <ClosingSection    onRequestAccess={() => openVideo('signup')} />

    </MainLayout>
  )
}
