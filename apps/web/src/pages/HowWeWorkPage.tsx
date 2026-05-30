import { MainLayout } from '@/components/layout'
import SEOHead from '@/components/SEOHead'
import { useClerk } from '@clerk/react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

/* ─────────────────────────────────────────────────
   SECTION 1 — HERO
───────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section
      id="hero"
      className="page-hero-compact bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden"
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/18 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-[30rem] h-[30rem] rounded-full bg-violet-500/12 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-indigo-400/6 blur-3xl" />
      </div>

      <div className="page-hero-content">
        <div className="animate-fade-up max-w-3xl">
          <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">
            How We Work
          </p>
          <h1 className="font-hero text-3xl sm:text-4xl lg:text-[2.8rem] font-extrabold text-white mb-6 tracking-tight leading-[1.15]">
            In real estate, the location decides the outcome —{' '}
            <span className="text-[#D4AF37] italic">long before the project does.</span>
          </h1>
          <div className="inline-block px-4 py-1.5 rounded-full border border-white/20 bg-white/5 mb-3">
            <p className="text-white font-semibold text-xs uppercase tracking-widest">WealthSpot Location Strategy · Investor View</p>
          </div>
          <p className="text-white/70 max-w-2xl text-lg leading-relaxed font-body">
            How WealthSpot Understands Locations and Markets
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
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: '#ffffff' }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">Our Methodology</p>
            <h2 className="font-hero text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-[#111827] leading-[1.12] tracking-tight">
              Building Conviction Through Process.
            </h2>
            <div
              className="mt-7 h-0.5 rounded-full w-20"
              style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }}
            />
          </div>

          <div className="flex flex-col gap-5 pt-2 lg:pt-10">
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              Before any opportunity reaches you, we first build conviction on the location using a clear, structured process.
            </p>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              Most real-estate decisions go wrong not because the flat or villa is bad, but because the location story was misunderstood or based on half information. Friends, brokers and social media talk about “hot areas”, but rarely show the full picture or the downside.
            </p>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed font-semibold">
              WealthSpot takes a different approach. We start with locations and corridors, not inventory.
            </p>
            <p className="font-body text-[15px] text-[#4B5563] leading-relaxed">
              We use verified sources, on-ground signals and historical patterns to understand how an area is evolving, and only then look for specific opportunities that fit that story.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Focus</p>
                <p className="font-bold text-[#111827] mb-1">Location-first</p>
                <p className="text-sm text-gray-500">Corridor thesis before project selection.</p>
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest mb-1">Approach</p>
                <p className="font-bold text-[#111827] mb-1">Evidence-led</p>
                <p className="text-sm text-gray-500">Golden sources, case files & risk view.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─────────────────────────────────────────────────
   SECTION 3 — METHODOLOGY STEPS (The Framework equivalent)
───────────────────────────────────────────────── */
const METHODOLOGY = [
  {
    num: '01',
    icon: '📡',
    title: 'Golden Sources: Where Our View Comes From',
    body: 'We do not depend on rumours or casual opinions. Our understanding of each micro-market is built on what we call Golden Sources – inputs that are verifiable, traceable and meaningful for long-term investors.',
    list: [
      'Government & regulation: master plans, zoning/FAR changes, town planning schemes, RERA and other regulatory updates.',
      'Infrastructure & mobility: metro lines and stations, ring roads, highways, tech parks, SEZs, and public infra that change connectivity.',
      'Respected research & public data: reports and datasets on absorption, vacancy, pricing and supply from credible institutions.',
      'On-ground intelligence: carefully filtered inputs from vetted builders and partners, always cross-checked against documents and public data.'
    ],
    highlight: 'Every relevant event from these sources is time-stamped and mapped to specific locations. Over time, this builds a factual history of how a corridor actually evolved, instead of relying on selective memory.\n\n• Year 1: Infra or policy announcement changes future potential of a corridor.\n• Year 3: Jobs, social infra and early projects start responding to those signals.\n• Year 5+: Price, rents and liquidity reflect how well the story actually played out.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    num: '02',
    icon: '🧠',
    title: 'Turning News into Clear, Usable Insight',
    body: 'A metro announcement or policy change does not automatically make an area a “hotspot”. For every important development, WealthSpot runs a simple but disciplined filter:',
    list: [
      'What changed? Is it infra, regulation, supply, demand, or a risk event?',
      'Where exactly? Which corridor, how far from job hubs and social infra, what kind of catchment?',
      'Who does it impact? End-users, long-term investors, renters, farmland buyers, hospitality assets, etc.',
      'How might it play out? Short term (1–3 years) vs. medium term (3–7 years), including risks and uncertainties.'
    ],
    highlight: 'We then convert this into a short, plain-English explanation that goes into our internal notes and, for live deals, into the investment memo – so you see not just the headline, but the logic behind it.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    num: '03',
    icon: '📚',
    title: 'Corridor Case Files: Learning from Past Cycles',
    body: 'To think sensibly about the future, we first study how similar locations behaved in the past. For key corridors, WealthSpot builds Corridor Case Files that track infra, jobs, supply and price/rent behaviour over multiple years.',
    list: [
      'Timeline of major infra and policy events.',
      'Entry of major employers and social infrastructure.',
      'Waves of project launches and type of supply.',
      'How prices and rents adjusted through upcycles and slowdowns.',
      'Typical time-lag between infra announcements and real impact.',
      'How oversupply shows up and how markets digest it.',
      'Which combinations of infra, jobs and supply led to more stable outcomes.'
    ],
    highlight: 'We do not claim to predict exact outcomes. We use these patterns to stay realistic about timelines, risks and expectations when we evaluate new corridors.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    num: '04',
    icon: '🔥',
    title: 'Corridor Scores & Heatmaps: A Simple Visual Summary',
    body: 'To make this easier to understand, we convert our corridor view into internal scores and heatmaps. These bring together: Infra strength & visibility, Job & demand drivers, Supply depth & quality, and Liquidity & absorption.',
    list: [],
    highlight: 'Example: A corridor with strong infra under execution, diversified job anchors, balanced supply and good transaction depth may rank high in our internal view. One with promising announcements but weak execution or oversupply may be marked as "emerging, but needs caution".\n\nThese scores are used to decide where we focus our diligence and what type of opportunities we consider suitable there. They are not used as marketing tools or return guarantees.\n\nImportant: Corridor scores are signals to guide work, not predictions. Every live opportunity you see comes with its own assumptions, risk notes and downside thinking.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  },
  {
    num: '05',
    icon: '🧭',
    title: 'How This Shows Up in Your WealthSpot Experience',
    body: 'Our intelligence engine is embedded into each WealthSpot opportunity, so that you are not asked to trust a project blindly or rely only on “my friend said this area is good”.',
    list: [
      'Use Golden Sources and case files to shortlist corridors.',
      'Evaluate land, titles and builders within those corridors.',
      'Design co-investment structures that suit the location’s risk and liquidity profile.',
      'A clear explanation of the location and corridor thesis.',
      'The key drivers we are relying on – and the risks we are cautious about.',
      'A governed investment journey from discovery to documentation, not a one-time sales pitch.'
    ],
    highlight: 'In short: you see the work behind the opportunity – so that your decision is based on visible reasoning, not just marketing.',
    accent: '#D4AF37',
    accentRgb: '212,175,55',
  }
]

function MethodologySection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28" style={{ background: '#ffffff' }}>
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-16">
        <div className="mb-14 max-w-2xl text-center mx-auto">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">Our Strategy</p>
          <h2 className="font-hero text-3xl sm:text-4xl font-bold text-[#111827] leading-[1.12] tracking-tight">
            How We Evaluate Markets.
          </h2>
        </div>

        <div className="relative flex flex-col gap-0 max-w-4xl mx-auto">
          <div
            className="absolute top-5 bottom-5 left-[34px] w-px hidden sm:block"
            style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.4) 0%, rgba(212,175,55,0.05) 100%)' }}
          />

          {METHODOLOGY.map(({ num, icon, title, body, list, highlight, accent, accentRgb }) => (
            <div key={num} className="flex items-start gap-8 py-8 sm:py-10 group">
              <div
                className="shrink-0 hidden sm:flex flex-col items-center justify-center w-[68px] h-[68px] rounded-full text-center relative z-10 bg-white"
                style={{
                  border: `1px solid rgba(${accentRgb},0.35)`,
                  color: accent,
                  boxShadow: `0 4px 12px rgba(${accentRgb}, 0.1)`
                }}
              >
                <span className="text-xl">{icon}</span>
              </div>

              <span
                className="sm:hidden text-xl mt-1"
              >
                {icon}
              </span>

              <div
                className="flex-1 rounded-2xl p-6 sm:p-8"
                style={{
                  background: `linear-gradient(135deg, rgba(${accentRgb},0.03) 0%, #ffffff 60%, #ffffff 100%)`,
                  border: `1px solid rgba(${accentRgb},0.18)`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="mb-4 h-px w-10 rounded-full group-hover:w-16 transition-all duration-300"
                  style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
                />
                <h3 className="font-hero text-xl sm:text-2xl font-bold text-[#111827] mb-4">{num}. {title}</h3>
                <p className="font-body text-[15px] text-[#4B5563] leading-relaxed mb-4">{body}</p>
                
                {list.length > 0 && (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 mb-6">
                    {list.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[13px] text-[#4B5563]">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {highlight && (
                  <div className="mt-5 p-4 rounded-xl bg-white border border-gray-100 shadow-sm text-sm text-[#4B5563] italic whitespace-pre-wrap leading-relaxed">
                    {highlight}
                  </div>
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
   SECTION 4 — CTA (Why It Matters)
───────────────────────────────────────────────── */
function CTASection() {
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

        <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8 text-center">
          <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.28em] text-[#D4AF37]">Why It Matters For You</p>
          <h2 className="font-hero text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Built for investors who are tired of opacity.
          </h2>
          <p className="font-body text-[16px] text-white/70 leading-relaxed max-w-3xl mx-auto mb-14">
            For serious investors, the real pain points are opacity, over-reliance on informal advice, and the absence of structured downside thinking. Our strategy answers each one directly.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 text-left">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#D4AF37]/30 transition-colors">
              <span className="text-[#D4AF37] font-bold text-xl mb-3 block">01</span>
              <h3 className="text-white font-bold text-lg mb-2">Evidence over FOMO</h3>
              <p className="text-white/60 text-sm leading-relaxed">We replace rumour and fear-of-missing-out with documented, repeatable location insight you can examine yourself.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#D4AF37]/30 transition-colors">
              <span className="text-[#D4AF37] font-bold text-xl mb-3 block">02</span>
              <h3 className="text-white font-bold text-lg mb-2">A visible path</h3>
              <p className="text-white/60 text-sm leading-relaxed">The route from "news event" to "investment decision" is made transparent — never a black box.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-[#D4AF37]/30 transition-colors">
              <span className="text-[#D4AF37] font-bold text-xl mb-3 block">03</span>
              <h3 className="text-white font-bold text-lg mb-2">A thesis, not a brochure</h3>
              <p className="text-white/60 text-sm leading-relaxed">Every opportunity is tied to a clear corridor thesis and governance framework — not treated as an isolated project.</p>
            </div>
          </div>

          <div className="mb-12 border-t border-white/10 pt-10 text-center">
            <h4 className="text-xl font-bold text-[#D4AF37] mb-4">We do not claim to predict markets with certainty. We do commit to showing the work.</h4>
            <p className="text-white/60 max-w-2xl mx-auto text-sm leading-relaxed">
              The sources we watch. The patterns we recognise. The risks we are willing to live with — and the ones we are not. That is the role of WealthSpot's market intelligence: to turn early access into disciplined conviction.
            </p>
          </div>

          <button
            onClick={() => openSignUp({ forceRedirectUrl: '/vaults' })}
            className="inline-flex items-center gap-2.5 rounded-full bg-[#D4AF37] px-10 py-4 font-body text-[15px] font-bold text-slate-900 shadow-[0_0_40px_rgba(212,175,55,0.25)] transition-all duration-300 hover:brightness-110 hover:scale-[1.03] active:scale-100"
          >
            Explore Opportunities
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
export default function HowWeWorkPage() {
  return (
    <MainLayout>
      <SEOHead
        title="How We Work"
        description="WealthSpot Location Strategy. Learn how we evaluate markets, understand locations, and turn early access into disciplined conviction."
        path="/how-we-work"
      />
      <HeroSection />
      <IntroSection />
      <MethodologySection />
      <CTASection />
    </MainLayout>
  )
}
