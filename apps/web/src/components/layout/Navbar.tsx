import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Shield, Menu, X, Plus, PieChart, MessageCircle, Zap, Home } from 'lucide-react'
import {
  Show,
  SignInButton,
} from '@clerk/react'
import ProfileIndicator from '@/components/ProfileIndicator'
import OnboardingVideo from '@/components/OnboardingVideo'
import CreateOpportunityModal from '@/components/CreateOpportunityModal'
import { useUserStore } from '@/stores/user.store'
import { useProfileCompletionStatus } from '@/hooks/useProfileAPI'

const AUTH_NAV_LINKS = [
  { label: 'Home', href: '/vaults', icon: Home },
  { label: 'Portfolio', href: '/portfolio', icon: PieChart },
  { label: 'Community', href: '/community', icon: MessageCircle, roles: ['super_admin'] },
] as const

interface NavbarProps {
  /** @deprecated Props-based user is no longer needed — Clerk manages auth state. */
  user?: null
}

export default function Navbar(_props?: NavbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [showCreateOpp, setShowCreateOpp] = useState(false)
  const userRole = useUserStore((s) => s.user?.role)
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const { data: completion } = useProfileCompletionStatus()

  const extraLinks = [
    ...(userRole === 'super_admin' ? [{ label: 'Control Centre', href: '/control-centre' }] : []),
  ]
  const filteredAuthLinks = AUTH_NAV_LINKS.filter((link) => {
    if (!('roles' in link) || !link.roles) return true
    return userRole && (link.roles as readonly string[]).includes(userRole)
  })
  const allNavLinks = [...filteredAuthLinks, ...extraLinks]

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/vaults" className="flex items-center gap-2 shrink-0" aria-label="WealthSpot Home">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-display text-xl font-bold tracking-tight text-gray-900">
              Wealth<span className="text-primary">Spot</span>
            </span>
          </Link>

          {/* Desktop Nav — only visible when signed in */}
          <Show when="signed-in">
            <div className="hidden md:flex items-center gap-8 ml-10">
              {allNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    location.pathname === link.href ? 'text-primary' : 'text-gray-600'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </Show>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Clerk auth: signed-in → Create Opp + UserButton, signed-out → Sign In / Sign Up */}
            <Show when="signed-in">
              <button
                onClick={() => setShowCreateOpp(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Opportunity
              </button>
              <ProfileIndicator size="sm" />
            </Show>
            <Show when="signed-out">
              <div className="hidden sm:flex items-center gap-2">
                <SignInButton mode="modal" forceRedirectUrl="/vaults">
                  <button className="btn-ghost text-sm">Sign In</button>
                </SignInButton>
                <button className="btn-primary text-sm" onClick={() => setShowVideo(true)}>Get Started</button>
              </div>
            </Show>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-fade-up">
          <div className="px-4 py-4 space-y-1">
            <Show when="signed-in">
              {allNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'bg-primary/5 text-primary'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </Show>
            <Show when="signed-out">
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <SignInButton mode="modal" forceRedirectUrl="/vaults">
                  <button
                    className="btn-ghost text-sm flex-1 text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </button>
                </SignInButton>
                <button
                  className="btn-primary text-sm flex-1 text-center"
                  onClick={() => { setMobileOpen(false); setShowVideo(true) }}
                >
                  Get Started
                </button>
              </div>
            </Show>
          </div>
        </div>
      )}
    </header>

      {/* Profile completion banner — unmissable for incomplete profiles */}
      {isAuthenticated && completion && !completion.isComplete && location.pathname !== '/profile/complete' && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="h-4 w-4 shrink-0" />
              <p className="text-sm font-semibold truncate">
                Your profile is {completion.profileCompletionPct}% complete — finish it to unlock your referral code & premium features!
              </p>
            </div>
            <button
              onClick={() => navigate('/profile/complete')}
              className="shrink-0 px-4 py-1.5 bg-white text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-50 transition shadow-sm"
            >
              Complete Now
            </button>
          </div>
        </div>
      )}

      {/* Get Started → video → signup flow */}
      {showVideo && (
        <OnboardingVideo
          mode="signup"
          onComplete={() => setShowVideo(false)}
          onClose={() => setShowVideo(false)}
        />
      )}

      {/* Create Opportunity modal */}
      <CreateOpportunityModal open={showCreateOpp} onClose={() => setShowCreateOpp(false)} />
    </>
  )
}
