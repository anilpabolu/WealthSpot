import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import { useClerk } from '@clerk/react'
import { ArrowRight, Users, Shield, CheckCircle2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useState, useRef } from 'react'

/* ─────────────────────────────────────────────────
   SECTION 1 — HERO
───────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      id="hero"
      className="page-hero-compact bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden !pb-10 lg:!pb-14"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
      </div>

      <div className="page-hero-content text-center flex flex-col items-center">
        <div className="animate-fade-up max-w-4xl mx-auto">
          <h1 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight leading-[1.15]">
            Built on the belief that{' '}
            <span className="text-[#D4AF37] italic">real wealth is shareable.</span>
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-body">
            WealthSpot was founded to close the gap between institutional-grade real estate and the individual investor — making premium assets accessible, transparent, and genuinely collaborative.
          </p>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 2 — INTRO
───────────────────────────────────────────────── */
function IntroSection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-24"
      style={{ background: '#ffffff' }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">Who We Are</p>
          <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.8rem] font-bold text-[#111827] leading-[1.12] tracking-tight mb-8">
            Preserving Trust. Building Legacies.
          </h2>
          <p className="font-body text-lg text-[#4B5563] leading-relaxed max-w-3xl mx-auto font-medium">
            WealthSpot is a premium real estate discovery and strategic advisory platform engineered for discerning investors seeking access to high-quality property opportunities across India.
          </p>
          <div
            className="mt-8 h-0.5 rounded-full w-24 mx-auto"
            style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }}
          />
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-[#f8f9fa] p-8 rounded-3xl border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)] md:col-span-2">
             <p className="font-body text-[16px] text-[#4B5563] leading-relaxed">
               We operate as an intelligence-driven ecosystem that enables informed decision-making through curated project discovery, developer introductions, market intelligence, and strategic real estate insights. Our objective is to simplify access to credible opportunities while maintaining the highest standards of transparency, diligence, governance, and long-term relationship value.
             </p>
          </div>
          <div className="bg-[#f8f9fa] p-8 rounded-3xl border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
             <p className="font-body text-[16px] text-[#4B5563] leading-relaxed font-semibold mb-4 text-[#111827]">
               Every investment decision and transaction is undertaken independently and directly by the investor.
             </p>
             <p className="font-body text-[14px] text-[#4B5563] leading-relaxed">
               WealthSpot is not a public marketplace, collective investment vehicle, or pooled structure. We do not manage investor funds or operate AIFs.
             </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 3 — ECOSYSTEM
───────────────────────────────────────────────── */
function EcosystemSection() {
  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: 'linear-gradient(180deg, #080d18 0%, #0b1120 60%, #0a0f1c 100%)' }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/3 -left-24 w-[420px] h-[420px] rounded-full bg-[#D4AF37]/5 blur-[130px]" />
        <div className="absolute bottom-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-indigo-500/7 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16 text-center">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">The Ecosystem</p>
        <h2 className="font-hero text-3xl sm:text-4xl font-bold text-white leading-[1.12] tracking-tight mb-8">
          A Private Intelligence Ecosystem for Serious Investors
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-6">
          <p className="font-body text-[16px] text-white/80 leading-relaxed">
            WealthSpot is an elite, invite-only platform designed for global citizens, enterprise leaders, senior professionals, and high-net-worth individuals (HNIs) who seek disciplined exposure to strategically positioned real estate assets.
          </p>
          <p className="font-body text-[16px] text-white/80 leading-relaxed">
            For sophisticated investors, identifying premier land acquisitions, luxury residential developments, and high-potential commercial opportunities requires far more than market access — it demands precision, intelligence, and trusted execution.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            'Independent market intelligence',
            'Curated opportunity evaluation',
            'Developer and project assessment',
            'Strategic documentation coordination',
            'Structured transaction support'
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/30 transition-colors">
              <CheckCircle2 className="w-6 h-6 text-[#D4AF37] mb-3" />
              <p className="font-body text-[13px] text-center text-white/70 leading-snug">{item}</p>
            </div>
          ))}
        </div>

        <p className="mt-12 font-body text-[15px] text-[#D4AF37]/90 leading-relaxed max-w-2xl mx-auto italic">
          "By combining analytical rigor with a vetted network of developers and industry professionals, WealthSpot creates a more informed, efficient, and governance-aligned real estate investment experience."
        </p>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 4 — CORE PRINCIPLES
───────────────────────────────────────────────── */
const PRINCIPLES = [
  {
    icon: Search,
    title: 'Clarity in Opportunity Discovery',
    body: 'We focus on identifying structurally strong opportunities backed by data, location intelligence, infrastructure growth, and long-term demand visibility.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    icon: Shield,
    title: 'Discipline in Risk Awareness',
    body: 'Every opportunity is evaluated through structured diligence frameworks designed to enhance transparency, mitigate information asymmetry, and support informed decision-making.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    icon: Users,
    title: 'Trust in Relationships',
    body: 'We believe long-term value is built through credibility, governance, transparency, and alignment between investors, developers, and advisory stakeholders.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  }
]

function PrinciplesSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28" style={{ background: '#ffffff' }}>
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
        <div className="text-center mb-14">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">Our Core Principles</p>
          <h2 className="font-hero text-3xl sm:text-4xl font-bold text-[#111827] leading-[1.12] tracking-tight">
            Foundations of our platform.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {PRINCIPLES.map(({ icon: Icon, title, body, accent, accentRgb }) => (
            <div
              key={title}
              className="rounded-3xl p-8 sm:p-10 group relative shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)]"
              style={{
                background: `linear-gradient(135deg, rgba(${accentRgb},0.06) 0%, #ffffff 60%, #ffffff 100%)`,
                border: `1px solid rgba(${accentRgb},0.18)`,
                transition: 'border-color 300ms ease, box-shadow 300ms ease, transform 300ms ease',
              }}
            >
              <div
                className="mb-6 w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: `rgba(${accentRgb},0.10)`,
                  border: `1px solid rgba(${accentRgb},0.25)`,
                }}
              >
                <Icon className="h-7 w-7" style={{ color: accent }} />
              </div>
              <div
                className="mb-5 h-px w-10 rounded-full group-hover:w-16 transition-all duration-300"
                style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
              />
              <h3 className="font-hero text-xl font-bold text-[#111827] mb-3">{title}</h3>
              <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}


/* ─────────────────────────────────────────────────
   SECTION 6 — THE FRAMEWORK
───────────────────────────────────────────────── */
const FRAMEWORK = [
  {
    num: '01',
    title: 'Independent Curation & Due Diligence',
    body: 'Every property opportunity hosted within the WealthSpot ecosystem undergoes structured evaluation by our advisory and research network.',
    list: [
      'Regulatory and documentation verification',
      'Historical title validation',
      'Litigation and compliance review',
      'Location intelligence analysis',
      'Market absorption and demand assessment',
      'Developer capability and execution evaluation',
      'Risk and opportunity benchmarking'
    ],
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    num: '02',
    title: 'Zero-Pool Capital Architecture',
    body: 'We do not collect, aggregate, manage, or deploy investor capital. Transactions occur directly between the investor and the respective developer or asset-owning entity. WealthSpot does not manage capital structures, create collective SPVs, operate shared-appreciation models, or exercise discretionary investment control. Every investor retains full independence, ownership visibility, and decision-making authority over their transactions.',
    list: [],
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    num: '03',
    title: 'Compliance-Aligned Intelligence',
    body: 'WealthSpot does not provide regulated securities advisory, portfolio management services, or generalized financial planning. Our role is focused on real estate market intelligence, opportunity discovery support, localized infrastructure insights, asset-level research, and transaction coordination assistance.',
    list: [],
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    num: '04',
    title: 'Enterprise Data Privacy & Security',
    body: 'Investor confidentiality and data protection remain foundational to our operating philosophy. Our technology infrastructure is designed with enterprise-grade privacy and security standards to ensure that personal, financial, and transactional information remains encrypted, protected, and confidential.',
    list: [],
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
]

function FrameworkSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28" style={{ background: '#ffffff' }}>
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
        <div className="mb-14 max-w-3xl text-center mx-auto">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">The WealthSpot Framework</p>
          <h2 className="font-hero text-3xl sm:text-4xl font-bold text-[#111827] leading-[1.12] tracking-tight">
            Uncompromising Discipline.<br/>Institutional Governance.
          </h2>
          <p className="mt-4 font-body text-[15px] text-[#6B7280] leading-relaxed">
            To maintain structural transparency, operational integrity, and compliance alignment, WealthSpot operates under a disciplined governance framework.
          </p>
        </div>

        <div className="relative flex flex-col gap-0 max-w-6xl mx-auto">
          <div
            className="absolute top-5 bottom-5 left-[34px] w-px hidden sm:block"
            style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.05) 100%)' }}
          />

          {FRAMEWORK.map(({ num, title, body, list, accent, accentRgb }) => (
            <div key={num} className="flex items-start gap-8 py-8 sm:py-10 group">
              <div
                className="shrink-0 hidden sm:flex flex-col items-center justify-center w-[68px] h-[68px] rounded-full text-center relative z-10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                style={{
                  border: `1px solid rgba(${accentRgb},0.35)`,
                  color: accent,
                }}
              >
                <span className="text-[14px] font-black tracking-[0.05em]">{num}</span>
              </div>

              <span
                className="sm:hidden text-[14px] font-black mt-1"
                style={{ color: accent }}
              >
                {num}
              </span>

              <div
                className="flex-1 rounded-3xl p-6 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, rgba(${accentRgb},0.03) 0%, #ffffff 60%, #ffffff 100%)`,
                  border: `1px solid rgba(${accentRgb},0.18)`,
                }}
              >
                <div
                  className="mb-4 h-px w-10 rounded-full group-hover:w-16 transition-all duration-300"
                  style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                />
                <h3 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] mb-4">{title}</h3>
                <p className="font-body text-[15px] text-[#4B5563] leading-relaxed mb-4">{body}</p>
                
                {list.length > 0 && (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 border-t border-gray-200 pt-6">
                    {list.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[13px] text-[#4B5563]">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 7 — FOUNDING TEAM
───────────────────────────────────────────────── */
function FoundingTeamSection() {
  const { data: members, isLoading } = useQuery({
    queryKey: ['public-founding-team'],
    queryFn: async () => {
      const res = await api.get('/founding-team')
      return res.data
    },
  })

  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Use dummy data if no members yet for showcase
  const displayMembers = members && members.length > 0 ? members : [
    { id: '1', name: 'Alexander Sterling', title: 'Founder & CEO', description: 'With over 20 years in institutional real estate, Alexander has structured more than $2B in premium asset transactions globally. He previously served as Managing Director at a premier global investment firm, where he pioneered structured real estate products for UHNW individuals. His vision for WealthSpot is to democratize access to the top 1% of real estate opportunities with uncompromising governance.', previous_experience: ['Ex-Managing Director, BlackRock Real Estate', 'Wharton MBA', '20+ Years Institutional RE'], photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800' },
    { id: '2', name: 'Elena Rostova', title: 'Chief Investment Officer', description: 'Elena brings rigorous institutional discipline to WealthSpot. As former Head of Alternatives at a major European sovereign wealth fund, she specialized in prime commercial and luxury residential markets. She leads WealthSpot’s independent advisory panel and due diligence frameworks, ensuring every opportunity presented meets the strictest global standards of capital preservation and yield generation.', previous_experience: ['Former Head of Alternatives, Sovereign Fund', 'London School of Economics', '15+ Years Global Markets'], photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800' },
    { id: '3', name: 'Marcus Chen', title: 'Chief Technology Officer', description: 'A highly accomplished technologist, Marcus architected scalable, high-security financial infrastructure for top-tier fintech unicorns. He ensures the WealthSpot platform operates with enterprise-grade data privacy, seamless transaction architecture, and real-time intelligence, delivering a flawless digital experience that matches the exclusivity of our real estate portfolio.', previous_experience: ['Ex-Stripe Engineering Lead', 'Stanford Computer Science', 'Fintech Infrastructure Expert'], photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=800' },
  ]

  const activeMember = displayMembers[activeIndex]

  const scrollTo = (index: number) => {
    if (!scrollRef.current) return
    setActiveIndex(index)
    const cardWidth = 320 // approx width of image card
    scrollRef.current.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    })
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const scrollPosition = scrollRef.current.scrollLeft
    const cardWidth = 320
    const newIndex = Math.round(scrollPosition / cardWidth)
    if (newIndex !== activeIndex && newIndex < displayMembers.length) {
      setActiveIndex(newIndex)
    }
  }

  if (isLoading) {
    return <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-[#D4AF37] border-t-transparent animate-spin" /></div>
  }

  return (
    <section className="relative overflow-hidden py-24 sm:py-32" style={{ background: '#f8f9fa' }}>
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">The Leadership</p>
          <h2 className="font-hero text-3xl sm:text-4xl font-bold text-[#111827] leading-[1.12] tracking-tight">
            Meet the Founding Team
          </h2>
          <p className="mt-4 font-body text-[15px] text-[#6B7280] leading-relaxed">
            Our leadership combines decades of institutional real estate, private equity, and enterprise technology experience to deliver an unparalleled advisory and discovery platform.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Photo Carousel */}
          <div className="lg:col-span-7 relative">
            <div 
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayMembers.map((member: any, idx: number) => (
                <div 
                  key={member.id} 
                  className={`snap-center shrink-0 w-[280px] sm:w-[320px] aspect-[3/4] rounded-3xl overflow-hidden relative cursor-pointer transition-all duration-500 ${activeIndex === idx ? 'scale-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] ring-4 ring-[#D4AF37]/30' : 'scale-90 opacity-50 hover:opacity-80'}`}
                  onClick={() => scrollTo(idx)}
                >
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                      <Users className="w-16 h-16 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className={`absolute bottom-0 left-0 right-0 p-6 transition-transform duration-500 ${activeIndex === idx ? 'translate-y-0' : 'translate-y-4'}`}>
                    <h3 className="font-hero text-xl font-bold text-white">{member.name}</h3>
                    <p className="font-body text-sm font-medium text-[#D4AF37] mt-1">{member.title}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows */}
            <div className="absolute top-1/2 -translate-y-1/2 -left-4 -right-4 flex justify-between pointer-events-none hidden sm:flex">
              <button 
                onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
                className={`pointer-events-auto w-12 h-12 rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center text-gray-600 transition-all hover:bg-gray-50 hover:scale-105 hover:text-primary ${activeIndex === 0 ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}`}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={() => scrollTo(Math.min(displayMembers.length - 1, activeIndex + 1))}
                className={`pointer-events-auto w-12 h-12 rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 flex items-center justify-center text-gray-600 transition-all hover:bg-gray-50 hover:scale-105 hover:text-primary ${activeIndex === displayMembers.length - 1 ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100'}`}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-5 relative">
            <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-full pointer-events-none" />
              
              <div className="mb-6 relative z-10">
                <h3 className="font-hero text-2xl sm:text-3xl font-bold text-[#111827] mb-2 transition-all">{activeMember?.name}</h3>
                <p className="font-body text-base font-bold text-[#D4AF37] tracking-wide uppercase">{activeMember?.title}</p>
              </div>

              <div className="w-12 h-1 bg-gradient-to-r from-[#D4AF37] to-transparent mb-6 rounded-full" />

              <p className="font-body text-[15px] text-[#4B5563] leading-relaxed mb-8 relative z-10 transition-opacity duration-300">
                {activeMember?.description}
              </p>

              {activeMember?.previous_experience && activeMember.previous_experience.length > 0 && (
                <div className="relative z-10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">Previous Experience</p>
                  <ul className="space-y-3">
                    {activeMember.previous_experience.map((exp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0 shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                        <span className="font-body text-[14px] text-[#111827] font-medium leading-snug">{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 8 — CLOSING CTA & DISCLAIMER
───────────────────────────────────────────────── */
function ClosingSection() {
  const { openSignUp } = useClerk()

  return (
    <>
      <section
        className="relative overflow-hidden py-24 sm:py-32"
        style={{ background: 'linear-gradient(135deg, #080d1a 0%, #0d1324 50%, #080d1a 100%)' }}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-[#D4AF37]/6 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-indigo-600/8 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 sm:px-8 text-center">
          <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">WealthSpot Vision</p>
          <h2 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-8">
            Welcome to WealthSpot
          </h2>
          <p className="font-body text-[16px] text-white/70 leading-relaxed max-w-2xl mx-auto mb-10">
            A platform where intelligence drives discovery, governance builds confidence, and trust creates enduring legacies. We aim to redefine how sophisticated investors discover, evaluate, and engage with real estate opportunities in India.
          </p>
          <button
            onClick={() => openSignUp({ forceRedirectUrl: '/vaults' })}
            className="inline-flex items-center gap-2.5 rounded-full bg-[#D4AF37] px-10 py-4 font-body text-[15px] font-bold text-slate-900 shadow-[0_0_40px_rgba(212,175,55,0.25)] transition-all duration-300 hover:brightness-110 hover:scale-[1.03] active:scale-100"
          >
            Join the Ecosystem
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>


    </>
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
        description="WealthSpot is a premium real estate discovery and strategic advisory platform engineered for discerning investors."
        path="/about"
      />
      <HeroSection />
      <IntroSection />
      <EcosystemSection />
      <PrinciplesSection />
      <FrameworkSection />
      <FoundingTeamSection />
      <ClosingSection />
    </MainLayout>
  )
}
