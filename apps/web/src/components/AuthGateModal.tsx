import { useEffect, useState } from 'react'
import { SignInButton, SignUpButton } from '@clerk/react'
import { Building2, TrendingUp, ShieldCheck, Lock } from 'lucide-react'
import { useUserStore } from '@/stores/user.store'

const DELAY_MS = 3000

export default function AuthGateModal() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isAuthenticated) return
    const t = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [isAuthenticated])

  if (isAuthenticated || !visible) return null

  const returnUrl = window.location.pathname + window.location.search

  return (
    /* Fixed overlay — backdrop click is a deliberate no-op */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm px-4 animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Modal card */}
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex">

        {/* ── Left decorative panel (desktop only) ── */}
        <div className="hidden md:flex flex-col justify-between w-2/5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <span className="text-white font-semibold text-sm tracking-wide">WealthSpot</span>
          </div>

          <div className="space-y-6">
            {[
              { icon: TrendingUp, text: 'Access real-time investment data & returns' },
              { icon: ShieldCheck, text: 'SHIELD-verified opportunities only' },
              { icon: Lock, text: 'Exclusive deal flow for verified investors' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="mt-0.5 h-6 w-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-white/70" />
                </div>
                <p className="text-white/60 text-sm leading-snug">{text}</p>
              </div>
            ))}
          </div>

          <p className="text-white/30 text-xs">
            Join thousands of investors already on the platform.
          </p>
        </div>

        {/* ── Right action panel ── */}
        <div className="flex-1 bg-[#0f0f1a] p-8 flex flex-col justify-center gap-7">
          {/* Lock badge */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-amber-500/15 flex items-center justify-center">
              <Lock className="h-4 w-4 text-amber-400" />
            </div>
            <span className="text-amber-400 text-xs font-medium uppercase tracking-widest">
              Members only
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white leading-tight">
              Sign up or sign in<br />to continue
            </h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Create a free account to unlock full property details, investment insights and curated deal flow.
            </p>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <SignUpButton mode="modal" forceRedirectUrl={returnUrl}>
              <button className="w-full py-3 px-5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all">
                Create free account
              </button>
            </SignUpButton>

            <SignInButton mode="modal" forceRedirectUrl={returnUrl}>
              <button className="w-full py-3 px-5 rounded-xl border border-white/10 bg-white/5 text-white/80 font-medium text-sm hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all">
                Already a member? Sign in
              </button>
            </SignInButton>
          </div>

          <p className="text-white/25 text-xs text-center">
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
