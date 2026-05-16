import { useState } from 'react'
import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import { useClerk } from '@clerk/react'
import { ArrowRight, Target, Users, Shield, Zap, TrendingUp, Globe, Heart, Lightbulb } from 'lucide-react'

/* ─────────────────────────────────────────────────
   SECTION 1 — HERO
   Dark gradient, full-viewport, text centred bottom
───────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      className="relative flex min-h-[70vh] flex-col overflow-hidden -mt-16"
      style={{ background: 'linear-gradient(135deg, #080d1a 0%, #0d1324 45%, #0f1a2e 70%, #080d1a 100%)' }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] rounded-full bg-[#D4AF37]/6 blur-3xl" />
        <div className="absolute top-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-indigo-600/8 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-[300px] h-[300px] rounded-full bg-violet-600/6 blur-3xl" />
      </div>

      {/* Corner bracket accents */}
      <div className="pointer-events-none absolute inset-x-8 top-24 bottom-8 hidden lg:block">
        <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-[#D4AF37]/20 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#D4AF37]/20 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#D4AF37]/20 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-[#D4AF37]/20 rounded-br-xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 mt-auto w-full">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-16 pb-20 lg:pb-28">
          <div className="max-w-3xl">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
              Our Story
            </p>
            <h1 className="font-hero text-[2.4rem] sm:text-5xl lg:text-[4rem] font-bold text-white leading-[1.08] tracking-tight">
              Built on the belief that{' '}
              <span className="text-[#D4AF37] italic">real wealth is shareable.</span>
            </h1>
            <p className="mt-6 font-body text-[1.05rem] sm:text-lg text-white/70 leading-relaxed max-w-xl">
              WealthSpot was founded to close the gap between institutional-grade real estate and the individual investor — making premium assets accessible, transparent, and genuinely collaborative.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 2 — MISSION
   Two-column split: bold statement left, body right
───────────────────────────────────────────────── */
function MissionSection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: '#FDFBF5' }}
    >
      {/* Top gold separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left — bold mission statement */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">Our Mission</p>
            <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-[#111827] leading-[1.12] tracking-tight">
              Democratising access to premium assets — one fraction at a time.
            </h2>
            {/* Expanding accent rule */}
            <div
              className="mt-7 h-0.5 rounded-full w-20"
              style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }}
            />
          </div>

          {/* Right — body paragraphs */}
          <div className="flex flex-col gap-5 pt-2 lg:pt-10">
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              For too long, meaningful real estate investment required institutional scale. You needed deep pockets, deep connections, and deep knowledge just to get in the room. WealthSpot changes that equation entirely.
            </p>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              Our platform brings together serious investors, experienced builders, and curated opportunities under one roof — structured for transparency, designed for trust, and built to compound value over time.
            </p>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              We believe the future of wealth-building is collaborative. Capital alone is rarely the limiting factor — alignment, quality of deals, and the right relationships are. WealthSpot exists to provide all three.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 3 — OUR STORY
   Numbered milestone timeline
───────────────────────────────────────────────── */
const MILESTONES = [
  {
    year: '2022',
    title: 'The Idea',
    body: 'Three co-founders noticed the same frustration: premium real estate was generating outstanding returns — but only for a small, well-connected few. The seed of WealthSpot was planted in a co-working space in Bengaluru over chai and a whiteboard.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    year: '2023',
    title: 'Building in Private',
    body: 'The first 18 months were spent deep in research, regulatory groundwork, and product design. We spoke to over 200 investors, 50 builders, and a dozen legal experts to understand exactly what was broken — and what needed to be built right.',
    accent: '#8B5CF6',
    accentRgb: '139,92,246',
  },
  {
    year: '2024',
    title: 'Vault Architecture',
    body: 'The three-vault model — Wealth, Safe, and Community — emerged as the clearest way to serve different investor profiles without diluting the quality of any single experience. This became the architectural backbone of the platform.',
    accent: '#10B981',
    accentRgb: '16,185,129',
  },
  {
    year: '2025',
    title: 'Private Beta',
    body: 'WealthSpot opened to its first cohort of early members. The response validated every assumption: investors were hungry for curated access, builders needed a trusted distribution channel, and the WealthSpot Shield framework set a new bar for due diligence.',
    accent: '#F59E0B',
    accentRgb: '245,158,11',
  },
  {
    year: '2026',
    title: 'Platform Launch',
    body: 'With a growing community of verified investors and builders across India, WealthSpot is live. The journey from whiteboard to platform is complete. The journey from platform to ecosystem has just begun.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
]

function OurStorySection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: 'linear-gradient(180deg, #080d18 0%, #0b1120 60%, #0a0f1c 100%)' }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 -left-24 w-[420px] h-[420px] rounded-full bg-[#D4AF37]/5 blur-[130px]" />
        <div className="absolute bottom-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-indigo-500/7 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">

        {/* Heading */}
        <div className="mb-14 max-w-xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">The Journey</p>
          <h2 className="font-hero text-3xl sm:text-4xl font-bold text-white leading-[1.12] tracking-tight">
            Five years of building what the market was missing.
          </h2>
        </div>

        {/* Timeline */}
        <div className="relative flex flex-col gap-0">
          {/* Vertical connector line */}
          <div
            className="absolute top-5 bottom-5 left-[52px] w-px hidden sm:block"
            style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.05) 100%)' }}
          />

          {MILESTONES.map(({ year, title, body, accent, accentRgb }) => (
            <div key={year} className="flex items-start gap-8 py-8 sm:py-10 group">
              {/* Year bubble */}
              <div
                className="shrink-0 hidden sm:flex flex-col items-center justify-center w-[68px] h-[68px] rounded-full text-center relative z-10"
                style={{
                  border: `1px solid rgba(${accentRgb},0.35)`,
                  background: `rgba(${accentRgb},0.08)`,
                  color: accent,
                }}
              >
                <span className="text-[11px] font-black uppercase tracking-[0.12em]">{year}</span>
              </div>

              {/* Mobile year label */}
              <span
                className="sm:hidden text-[11px] font-black uppercase tracking-[0.2em] mt-1"
                style={{ color: accent }}
              >
                {year}
              </span>

              {/* Content card */}
              <div
                className="flex-1 rounded-2xl p-6 sm:p-7"
                style={{
                  background: `linear-gradient(135deg, rgba(${accentRgb},0.03) 0%, #0b1022 50%, #080d1a 100%)`,
                  border: `1px solid rgba(${accentRgb},0.18)`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.40)',
                }}
              >
                {/* Accent rule */}
                <div
                  className="mb-4 h-px w-10 rounded-full group-hover:w-16 transition-all duration-300"
                  style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                />
                <h3 className="font-hero text-lg sm:text-xl font-bold text-white mb-2">{title}</h3>
                <p className="font-body text-[14px] text-white/70 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 4 — CORE VALUES
   2×2 dark glass card grid
───────────────────────────────────────────────── */
const CORE_VALUES = [
  {
    icon: Shield,
    category: 'INTEGRITY',
    title: 'Trust by Design',
    body: 'Every feature, process, and partnership decision is filtered through one question: does this make the platform more trustworthy? We believe trust is the only durable competitive advantage.',
    italic: "We'd rather build slowly on solid ground than scale quickly on sand.",
    accent: '#D4AF37',
    accentRgb: '212,175,55',
    tag: 'Core Principle',
  },
  {
    icon: Users,
    category: 'COMMUNITY',
    title: 'Collective Intelligence',
    body: 'The best investment decisions are rarely made alone. We build features that surface collective wisdom, enable peer learning, and reward members who contribute knowledge and relationships — not just capital.',
    italic: 'A rising tide lifts all vaults.',
    accent: '#8B5CF6',
    accentRgb: '139,92,246',
    tag: null,
  },
  {
    icon: Lightbulb,
    category: 'CURATION',
    title: 'Quality Over Volume',
    body: 'We reject the marketplace model of infinite listings and zero accountability. Every opportunity on WealthSpot passes through our Shield framework — a rigorous multi-dimensional assessment before it reaches investors.',
    italic: 'Fewer, better deals. Always.',
    accent: '#10B981',
    accentRgb: '16,185,129',
    tag: null,
  },
  {
    icon: Globe,
    category: 'ACCESS',
    title: 'Inclusive by Architecture',
    body: "Fractional ownership isn't a gimmick — it's the mechanism that allows a salaried professional to own a stake in the same asset as a family office. We've built our entire product architecture around making this not just possible, but effortless.",
    italic: 'Premium assets for people, not just portfolios.',
    accent: '#F59E0B',
    accentRgb: '245,158,11',
    tag: null,
  },
]

function CoreValuesSection() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: '#FDFBF5' }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">

        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">What We Stand For</p>
            <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-[#111827] leading-[1.12] tracking-tight max-w-lg">
              Four values that shape every decision we make.
            </h2>
          </div>
          <p className="font-body text-[14px] text-[#6B7280] leading-relaxed max-w-xs sm:text-right">
            Principles aren't plaques on a wall. They're choices made under pressure.
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
          {CORE_VALUES.map((value, i) => {
            const isHovered = hovered === i
            const Icon = value.icon
            return (
              <div
                key={value.category}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className="group relative rounded-2xl overflow-hidden cursor-default"
                style={{
                  transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                  background: `linear-gradient(135deg, rgba(${value.accentRgb},0.06) 0%, #ffffff 60%, #FDFBF5 100%)`,
                  border: `1px solid rgba(${value.accentRgb},${isHovered ? '0.45' : '0.18'})`,
                  boxShadow: isHovered
                    ? `0 0 30px rgba(${value.accentRgb},0.12), 0 8px 24px rgba(0,0,0,0.08)`
                    : '0 2px 12px rgba(0,0,0,0.06)',
                  transition: 'transform 300ms ease, border-color 300ms ease, box-shadow 300ms ease',
                }}
              >
                <div className="p-7 sm:p-8">
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-6">
                    <span
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em]"
                      style={{ color: value.accent }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {value.category}
                    </span>
                    {value.tag && (
                      <span
                        className="text-[10px] font-semibold rounded-full px-2 py-0.5"
                        style={{
                          background: `rgba(${value.accentRgb},0.12)`,
                          color: value.accent,
                          border: `1px solid rgba(${value.accentRgb},0.25)`,
                        }}
                      >
                        {value.tag}
                      </span>
                    )}
                  </div>

                  {/* Accent rule — expands on hover */}
                  <div
                    className="mb-5 h-px rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${value.accent}, transparent)`,
                      width: isHovered ? '80px' : '40px',
                      transition: 'width 300ms ease',
                    }}
                  />

                  <h3 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] mb-3 leading-snug">
                    {value.title}
                  </h3>
                  <p className="font-body text-[14px] text-[#374151] leading-relaxed mb-4">
                    {value.body}
                  </p>
                  <p
                    className="font-body text-[13px] italic leading-relaxed"
                    style={{ color: `rgba(${value.accentRgb},0.85)` }}
                  >
                    {value.italic}
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

/* ─────────────────────────────────────────────────
   SECTION 5 — WHY WEALTHSPOT
   3-col feature highlights
───────────────────────────────────────────────── */
const DIFFERENTIATORS = [
  {
    icon: Shield,
    title: 'The WealthSpot Shield',
    body: 'Every opportunity listed on the platform passes through our proprietary Shield framework — a seven-dimension assessment covering financials, legal structure, builder track record, market positioning, risk factors, and exit clarity. Investors never fly blind.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    icon: TrendingUp,
    title: 'Three Vault Architecture',
    body: 'Unlike generic marketplaces, WealthSpot organises opportunities into three distinct vaults — each calibrated for a different investor objective: appreciation (Wealth Vault), income (Safe Vault), and collaboration (Community Vault). Clarity by design.',
    accent: '#10B981',
    accentRgb: '16,185,129',
  },
  {
    icon: Heart,
    title: 'Beyond Capital',
    body: 'WealthSpot is the only platform that formally recognises four forms of investor participation: money, time, network, and knowledge. This unlocks deal structures previously available only to insiders — and rewards every type of contribution.',
    accent: '#8B5CF6',
    accentRgb: '139,92,246',
  },
  {
    icon: Target,
    title: 'Curated, Not Crowded',
    body: 'We list fewer opportunities on purpose. Every deal that passes Shield review receives dedicated promotion, investor matching, and builder support. Quality access beats noisy abundance every time.',
    accent: '#F59E0B',
    accentRgb: '245,158,11',
  },
  {
    icon: Zap,
    title: 'Faster Closings',
    body: 'Smart document management, digital EOI workflows, and automated investor-builder communication cut deal closure timelines dramatically. What once took months now takes weeks — without sacrificing rigour.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    icon: Globe,
    title: 'India-First, Global-Ready',
    body: 'Built specifically for the Indian regulatory environment, WealthSpot is designed with global standards in mind. We support NRI investors, multi-currency accounting, and structures that comply with SEBI and FEMA frameworks.',
    accent: '#10B981',
    accentRgb: '16,185,129',
  },
]

function WhyWealthSpotSection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: 'linear-gradient(180deg, #080d18 0%, #0b1120 60%, #0a0f1c 100%)' }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-[#D4AF37]/4 blur-[80px]" />
        <div className="absolute bottom-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-indigo-500/6 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">

        <div className="text-center mb-14">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">Why WealthSpot</p>
          <h2 className="font-hero text-3xl sm:text-4xl font-bold text-white leading-[1.12] tracking-tight">
            Built different, on purpose.
          </h2>
          <p className="mt-4 font-body text-[15px] text-white/55 leading-relaxed max-w-xl mx-auto">
            Six structural advantages that separate WealthSpot from everything else in the market.
          </p>
        </div>

        {/* 3-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {DIFFERENTIATORS.map(({ icon: Icon, title, body, accent, accentRgb }) => (
            <div
              key={title}
              className="rounded-2xl p-6 sm:p-7 group"
              style={{
                background: `linear-gradient(135deg, rgba(${accentRgb},0.03) 0%, #0b1022 60%, #080d1a 100%)`,
                border: `1px solid rgba(${accentRgb},0.18)`,
                boxShadow: '0 4px 20px rgba(0,0,0,0.40)',
              }}
            >
              <div
                className="mb-5 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `rgba(${accentRgb},0.10)`,
                  border: `1px solid rgba(${accentRgb},0.25)`,
                }}
              >
                <Icon className="h-5 w-5" style={{ color: accent }} />
              </div>
              <h3 className="font-hero text-[17px] font-bold text-white mb-3">{title}</h3>
              <p className="font-body text-[13px] text-white/70 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 6 — TEAM
   Placeholder leadership cards in 3-col grid
───────────────────────────────────────────────── */
const TEAM_MEMBERS = [
  {
    name: 'Arjun Mehta',
    role: 'Co-Founder & CEO',
    bio: "Former investment banker with 12 years across real estate structuring and private equity. Believes the best deals aren't found — they're built.",
    initials: 'AM',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    name: 'Priya Nair',
    role: 'Co-Founder & CTO',
    bio: 'Full-stack architect who previously led engineering at two fintech unicorns. Obsessed with systems that are both beautiful and bulletproof.',
    initials: 'PN',
    accent: '#8B5CF6',
    accentRgb: '139,92,246',
  },
  {
    name: 'Rohan Kapoor',
    role: 'Co-Founder & COO',
    bio: 'Operational specialist with a background in scaling regulated businesses. Has overseen the structuring of ₹800Cr+ in real estate transactions.',
    initials: 'RK',
    accent: '#10B981',
    accentRgb: '16,185,129',
  },
  {
    name: 'Sneha Iyer',
    role: 'Head of Curation',
    bio: 'Former CBRE analyst who spent a decade evaluating commercial and residential assets across Tier-1 and Tier-2 Indian cities. Runs the Shield framework.',
    initials: 'SI',
    accent: '#F59E0B',
    accentRgb: '245,158,11',
  },
  {
    name: 'Vikram Sharma',
    role: 'Head of Builder Relations',
    bio: 'Spent 15 years on the developer side before switching to the platform world. Uniquely positioned to bridge the investor-builder trust gap.',
    initials: 'VS',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    name: 'Divya Rangan',
    role: 'Legal & Compliance Lead',
    bio: 'Corporate lawyer with deep expertise in SEBI real estate regulations, FEMA compliance, and fractional ownership structuring under Indian law.',
    initials: 'DR',
    accent: '#8B5CF6',
    accentRgb: '139,92,246',
  },
]

function TeamSection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: '#FDFBF5' }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">

        <div className="text-center mb-14">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">The Team</p>
          <h2 className="font-hero text-3xl sm:text-4xl font-bold text-[#111827] leading-[1.12] tracking-tight">
            A team that has lived both sides of the table.
          </h2>
          <p className="mt-4 font-body text-[15px] text-[#6B7280] leading-relaxed max-w-xl mx-auto">
            Former bankers, developers, lawyers, and engineers — united by the conviction that better tools create better outcomes for everyone in the real estate ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {TEAM_MEMBERS.map(({ name, role, bio, initials, accent, accentRgb }) => (
            <div
              key={name}
              className="rounded-2xl p-6 sm:p-7 group"
              style={{
              background: `linear-gradient(135deg, rgba(${accentRgb},0.06) 0%, #ffffff 60%, #FDFBF5 100%)`,
              border: `1px solid rgba(${accentRgb},0.18)`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'border-color 300ms ease, box-shadow 300ms ease',
              }}
            >
              {/* Avatar */}
              <div
                className="mb-5 w-14 h-14 rounded-full flex items-center justify-center text-base font-black"
                style={{
                  background: `rgba(${accentRgb},0.12)`,
                  border: `1.5px solid rgba(${accentRgb},0.35)`,
                  color: accent,
                }}
              >
                {initials}
              </div>

              {/* Accent rule */}
              <div
                className="mb-4 h-px w-10 rounded-full group-hover:w-16 transition-all duration-300"
                style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
              />

              <h3 className="font-hero text-[17px] font-bold text-[#111827] mb-1">{name}</h3>
              <p
                className="font-body text-[11px] font-bold uppercase tracking-[0.18em] mb-3"
                style={{ color: accent }}
              >
                {role}
              </p>
              <p className="font-body text-[13px] text-[#4B5563] leading-relaxed">{bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 7 — CLOSING CTA
   Exact pattern of LandingPage ClosingSection
───────────────────────────────────────────────── */
function ClosingSection() {
  const { openSignUp } = useClerk()

  return (
    <section
      className="relative overflow-hidden py-24 sm:py-32"
      style={{ background: 'linear-gradient(135deg, #080d1a 0%, #0d1324 50%, #080d1a 100%)' }}
    >
      {/* Decorative glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#D4AF37]/6 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-600/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 sm:px-8 text-center">
        <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">Join WealthSpot</p>
        <h2 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-8">
          Ready to invest in what actually matters?
        </h2>
        <p className="font-body text-[15px] text-white/55 leading-relaxed max-w-xl mx-auto mb-12">
          Join a growing community of serious investors who believe real wealth is built through curated access, disciplined entry, and the right partnerships — not noise.
        </p>
        <button
          onClick={() => openSignUp({ forceRedirectUrl: '/vaults' })}
          className="inline-flex items-center gap-2.5 rounded-full bg-[#D4AF37] px-10 py-4 font-body text-[15px] font-bold text-slate-900 shadow-[0_0_40px_rgba(212,175,55,0.25)] transition-all duration-300 hover:brightness-110 hover:scale-[1.03] active:scale-100"
        >
          Request Access
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   PAGE EXPORT
───────────────────────────────────────────────── */
export default function AboutPage() {
  return (
    <MainLayout>
      <SEOHead
        title="About Us"
        description="WealthSpot was built to democratise access to premium real estate. Learn about our mission, story, values, and the team behind the platform."
        path="/about"
      />
      <HeroSection />
      <MissionSection />
      <OurStorySection />
      <CoreValuesSection />
      <WhyWealthSpotSection />
      <TeamSection />
      <ClosingSection />
    </MainLayout>
  )
}
