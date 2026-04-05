import { useState } from 'react'
import { MainLayout } from '@/components/layout'
import OnboardingVideo from '@/components/OnboardingVideo'
import {
  Shield,
  TrendingUp,
  Users,
  Building2,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  Lock,
  BarChart3,
  Wallet,
  Search,
} from 'lucide-react'


/* ---------- Hero ---------- */
function HeroSection({ onHowItWorks }: { onHowItWorks: () => void }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1B2A4A] via-[#2D3F5E] to-[#1B2A4A] flex-1 flex items-center">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -right-20 -top-20 text-[12rem]">🏛️</div>
        <div className="absolute -left-10 -bottom-10 text-[8rem]">💎</div>
      </div>
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-16 relative z-10">
        <div className="space-y-6 max-w-2xl">
          <span className="page-hero-badge">
            <Zap className="h-3.5 w-3.5 inline mr-1.5" />
            SEBI-Compliant Fractional Ownership
          </span>
          <h1 className="font-hero text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Own Premium
            <br />
            Real Estate from{' '}
            <span className="text-[#D4AF37]">₹10,000</span>
          </h1>
          <p className="text-lg text-white/70 max-w-lg leading-relaxed font-body">
            WealthSpot makes fractional real estate investing accessible to everyone.
            Earn up to 18% IRR on RERA-verified properties across India's top cities.
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={onHowItWorks} className="btn-gradient bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-base px-8 py-3.5 inline-flex items-center gap-2">
              How it Works
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-1.5 text-sm text-white/60">
              <Lock className="h-4 w-4 text-emerald-400" />
              256-bit Encryption
            </div>
            <div className="flex items-center gap-1.5 text-sm text-white/60">
              <Shield className="h-4 w-4 text-[#D4AF37]" />
              SEBI Registered
            </div>
            <div className="flex items-center gap-1.5 text-sm text-white/60">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              RERA Verified
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ---------- Platform Stats ---------- */
function StatsBar() {
  const stats = [
    { label: 'Verified Properties', value: 'RERA Approved', icon: Building2 },
    { label: 'Growing Community', value: 'Thousands+', icon: Users },
    { label: 'Target Returns', value: 'Up to 18% IRR', icon: TrendingUp },
    { label: 'Your Capital', value: 'Fully Secured', icon: Shield },
  ]

  return (
    <section className="bg-white border-y border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="stat-card-icon bg-primary/10 shrink-0">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{s.label}</p>
                <p className="font-mono text-lg font-bold text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- How It Works ---------- */
function HowItWorks() {
  const steps = [
    { num: 1, title: 'Browse & Select', desc: 'Discover RERA-verified properties across India’s fastest-growing cities, curated by investment experts.', icon: Search },
    { num: 2, title: 'Invest Fractionally', desc: 'Choose your investment amount and pay securely. No barriers, no middlemen.', icon: Wallet },
    { num: 3, title: 'Earn Returns', desc: 'Receive rental income and capital appreciation directly into your account, every quarter.', icon: TrendingUp },
    { num: 4, title: 'Track & Grow', desc: 'Monitor your portfolio’s IRR, asset allocation, and payouts with a real-time dashboard.', icon: BarChart3 },
  ]

  return (
    <section id="how-it-works" className="page-section bg-gray-50">
      <div className="page-section-container">
        <div className="text-center mb-12">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle mx-auto">
            Four simple steps to start building your real estate wealth portfolio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="card p-6 text-center group hover:border-primary/30 transition-colors">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="text-xs font-bold text-primary mb-1">STEP {step.num}</div>
              <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- Testimonials ---------- */
function Testimonials() {
  const reviews = [
    {
      name: 'Priya Sharma',
      role: 'Software Engineer, Bengaluru',
      avatar: '',
      quote: 'WealthSpot made it incredibly easy to start investing in real estate. My portfolio has grown 16% in just 8 months!',
      rating: 5,
    },
    {
      name: 'Rajesh Kumar',
      role: 'CA, Mumbai',
      avatar: '',
      quote: 'The transparency and RERA compliance gives me confidence. I can track every rupee invested and the returns are consistent.',
      rating: 5,
    },
    {
      name: 'Anita Desai',
      role: 'Doctor, Pune',
      avatar: '',
      quote: 'Finally a platform that makes real estate investing accessible! Started with ₹50,000 and now have a diversified portfolio.',
      rating: 5,
    },
  ]

  return (
    <section className="page-section bg-gray-50">
      <div className="page-section-container">
        <div className="text-center mb-12">
          <h2 className="section-title">What Investors Say</h2>
          <p className="section-subtitle mx-auto">Trusted by thousands of investors across India</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((r) => (
            <div key={r.name} className="card p-6">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">"{r.quote}"</p>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- CTA Section ---------- */
function CtaSection({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="py-20 bg-gradient-to-br from-[#1B2A4A] via-[#2D3F5E] to-[#1B2A4A] relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute right-10 bottom-5 text-[10rem]">🚀</div>
      </div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="font-hero text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
          Your Wealth Story Starts Now 🚀
        </h2>
        <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
          Join a growing community of investors building generational wealth through premium real estate — with full transparency and SEBI-compliant security.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="btn-gradient bg-gradient-to-r from-[#D4AF37] to-[#B8860B] px-8 py-3.5 text-base inline-flex items-center gap-2"
          >
            Claim Your Spot
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

/* ---------- Landing Page ---------- */
export default function LandingPage() {
  const [showVideo, setShowVideo] = useState(false)
  const [videoMode, setVideoMode] = useState<'browse' | 'signup'>('browse')

  const openVideo = (mode: 'browse' | 'signup') => {
    setVideoMode(mode)
    setShowVideo(true)
  }

  return (
    <MainLayout>
      {/* Hero + metrics fill exactly one viewport (minus navbar) */}
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <HeroSection onHowItWorks={() => openVideo('browse')} />
        <StatsBar />
      </div>
      <HowItWorks />
      <Testimonials />
      <CtaSection onGetStarted={() => openVideo('signup')} />

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
