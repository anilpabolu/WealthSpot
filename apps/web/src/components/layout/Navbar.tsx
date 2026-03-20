import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Shield, Menu, X, Plus, PieChart, MessageCircle } from 'lucide-react'
import {
  Show,
  SignInButton,
} from '@clerk/react'
import ProfileIndicator from '@/components/ProfileIndicator'
import OnboardingVideo from '@/components/OnboardingVideo'
import CreateOpportunityModal from '@/components/CreateOpportunityModal'
import { useUserStore } from '@/stores/user.store'
import { APPROVAL_ROLES } from '@/lib/constants'

const AUTH_NAV_LINKS = [
  { label: 'Portfolio', href: '/portfolio', icon: PieChart },
  { label: 'Community', href: '/community', icon: MessageCircle, roles: ['super_admin'] },
] as const

interface NavbarProps {
  /** @deprecated Props-based user is no longer needed — Clerk manages auth state. */
  user?: null
}

export default function Navbar(_props?: NavbarProps) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [showCreateOpp, setShowCreateOpp] = useState(false)
  const userRole = useUserStore((s) => s.user?.role)

  const ANSWER_ROLES = new Set(['admin', 'super_admin', 'community_lead', 'knowledge_contributor', 'approver'])

  const extraLinks = [
    { label: 'Onboard Company', href: '/company-onboarding' },
    ...(userRole && ANSWER_ROLES.has(userRole) ? [{ label: 'Answer Questions', href: '/community/answer' }] : []),
    ...(userRole && APPROVAL_ROLES.includes(userRole) ? [{ label: 'Approvals', href: '/approvals' }] : []),
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
