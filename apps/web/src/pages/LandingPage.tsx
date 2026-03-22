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
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-gray-50 flex-1 flex items-center">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-16">
        <div className="space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="h-4 w-4" />
            SEBI-Compliant Fractional Ownership
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
            Own Premium
            <br />
            Real Estate from{' '}
            <span className="text-primary">₹10,000</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
            WealthSpot makes fractional real estate investing accessible to everyone.
            Earn up to 18% IRR on RERA-verified properties across India's top cities.
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-4">
            <button onClick={onHowItWorks} className="btn-primary text-base px-6 py-3 inline-flex items-center gap-2">
              How it Works
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Lock className="h-4 w-4 text-success" />
              256-bit Encryption
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Shield className="h-4 w-4 text-primary" />
              SEBI Registered
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <CheckCircle2 className="h-4 w-4 text-success" />
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
    { label: 'Total Invested', value: '₹42.5 Cr', icon: Wallet },
    { label: 'Active Investors', value: '8,200+', icon: Users },
    { label: 'Properties Listed', value: '45', icon: Building2 },
    { label: 'Avg. Returns', value: '14.2%', icon: TrendingUp },
  ]

  return (
    <section className="bg-white border-y border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{s.label}</p>
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
    { num: 1, title: 'Browse & Select', desc: 'Explore RERA-verified properties across top Indian cities.', icon: Search },
    { num: 2, title: 'Invest Fractionally', desc: 'Start from ₹10,000. Pay securely via Razorpay.', icon: Wallet },
    { num: 3, title: 'Earn Returns', desc: 'Receive rental income & capital appreciation directly.', icon: TrendingUp },
    { num: 4, title: 'Track & Grow', desc: 'Monitor IRR, portfolio allocation & payouts in real-time.', icon: BarChart3 },
  ]

  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="section-header">How It Works</h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
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
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="section-header">What Investors Say</h2>
          <p className="text-gray-500 mt-2">Trusted by thousands of investors across India</p>
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
    <section className="py-20 bg-primary">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
          Your Wealth Story Starts Now 🚀
        </h2>
        <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto opacity-90">
          8,000+ investors are already in the game. ₹10,000 is all it takes to join — your future self will thank you.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="bg-white text-primary font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
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
