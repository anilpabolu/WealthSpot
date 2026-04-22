import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Shield, Menu, X, Plus, PieChart, MessageCircle, Zap, Sparkles, Sun, Moon, Vault } from 'lucide-react'
import {
  Show,
  SignInButton,
  useClerk,
} from '@clerk/react'
import ProfileIndicator from '@/components/ProfileIndicator'
import OnboardingVideo from '@/components/OnboardingVideo'
import CreateOpportunityModal from '@/components/CreateOpportunityModal'
import { useUserStore } from '@/stores/user.store'
import { useThemeStore } from '@/stores/theme.store'
import { useProfileCompletionStatus } from '@/hooks/useProfileAPI'
import { useOverallProgress } from '@/hooks/useProfiling'
import { useVaultConfig } from '@/hooks/useVaultConfig'

const AUTH_NAV_LINKS = [
  { label: 'Vaults', href: '/vaults', icon: Vault },
  { label: 'Portfolio', href: '/portfolio', icon: PieChart, roles: ['investor', 'admin', 'super_admin'] },
  { label: 'My Listings', href: '/portal/builder/listings', icon: Sparkles, roles: ['builder', 'admin', 'super_admin'] },
  { label: 'Community', href: '/community', icon: MessageCircle, roles: ['super_admin', 'admin'] },
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
  const userRoles = useUserStore((s) => s.user?.roles ?? [])
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const { data: completion } = useProfileCompletionStatus()
  const { data: overall } = useOverallProgress()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const clerk = useClerk()
  const { introVideosEnabled } = useVaultConfig()

  const handleGetAccess = () => {
    if (introVideosEnabled) {
      setShowVideo(true)
    } else {
      clerk.openSignUp({ forceRedirectUrl: '/vaults' })
    }
  }

  const extraLinks = [
    ...(userRole === 'super_admin' ? [{ label: 'Control Centre', href: '/control-centre' }] : []),
  ]
  const filteredAuthLinks = AUTH_NAV_LINKS.filter((link) => {
    if (!('roles' in link) || !link.roles) return true
    const allowed = link.roles as readonly string[]
    // Check primary role AND multi-role array
    const roleMatch = (userRole && allowed.includes(userRole)) || userRoles.some((r) => allowed.includes(r))
    if (!roleMatch) return false
    return true
  })
  const allNavLinks = [...filteredAuthLinks, ...extraLinks]

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0c0a1f]/70 backdrop-blur-xl dark:saturate-[180%] border-b border-black/5 dark:border-white/10 transition-colors duration-300">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/vaults" className="flex items-center gap-2.5 shrink-0" aria-label="WealthSpot Home">
            <Shield className="h-8 w-8 text-indigo-400" />
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Wealth<span className="text-indigo-400 dark:text-indigo-400">Spot</span>
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-slate-400 dark:text-white/40 leading-none mt-0.5">
                Private Wealth Access
              </span>
            </div>
          </Link>

          {/* Desktop Nav — only visible when signed in */}
          <Show when="signed-in">
            <div className="hidden md:flex items-center gap-8 ml-10">
              {allNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors relative',
                    location.pathname === link.href
                      ? 'text-white after:absolute after:-bottom-[1.19rem] after:left-0 after:right-0 after:h-[2px] after:bg-indigo-400 after:rounded-full'
                      : 'text-white/60 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </Show>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-white/[0.06] border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-[#D4AF37]" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-400" />
              )}
            </button>
            {/* Clerk auth: signed-in → Create Opp + UserButton, signed-out → Sign In / Sign Up */}
            <Show when="signed-in">
              {(userRoles.includes('builder') || userRoles.includes('admin') || userRoles.includes('super_admin')) && (
              <button
                onClick={() => setShowCreateOpp(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-semibold shadow-[0_2px_8px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.45)] hover:brightness-110 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Opportunity
              </button>
              )}
              <ProfileIndicator size="sm" />
            </Show>
            <Show when="signed-out">
              <div className="hidden sm:flex items-center gap-2">
                <SignInButton mode="modal" forceRedirectUrl="/vaults">
                  <button className="btn-ghost text-sm">Sign In</button>
                </SignInButton>
                <button className="btn-primary text-sm" onClick={handleGetAccess}>Get Access to a Better Opportunity Environment</button>
              </div>
            </Show>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <X className="h-6 w-6 text-white/70" />
              ) : (
                <Menu className="h-6 w-6 text-white/70" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10 animate-fade-up">
          <div className="px-4 py-4 space-y-2">
            <Show when="signed-in">
              {allNavLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'block px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === link.href
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {/* Theme toggle in mobile signed-in */}
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors mt-2 border-t border-white/10 pt-3"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4 text-[#D4AF37]" /> : <Moon className="h-4 w-4 text-indigo-400" />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </Show>
            <Show when="signed-out">
              <div className="pt-3 border-t border-white/10 space-y-2">
                {/* Theme toggle in mobile */}
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4 text-[#D4AF37]" /> : <Moon className="h-4 w-4 text-indigo-400" />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <div className="flex gap-2">
                <SignInButton mode="modal" forceRedirectUrl="/vaults">
                  <button
                    className="text-white/70 hover:text-white text-sm font-semibold flex-1 text-center px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </button>
                </SignInButton>
                <button
                  className="btn-primary text-sm flex-1 text-center"
                  onClick={() => { setMobileOpen(false); handleGetAccess() }}
                >
                  Get Access
                </button>
                </div>
              </div>
            </Show>
          </div>
        </div>
      )}
    </header>

      {/* Profile completion banner — unmissable for incomplete profiles */}
      {isAuthenticated && completion && !completion.isComplete && location.pathname !== '/profile/complete' && (
        <div
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => navigate('/profile/complete')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/profile/complete') }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2">
            <Zap className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">
              ⚡ Your investor profile is {completion.profileCompletionPct}% ready — complete it to unlock your full potential & start investing!
            </p>
          </div>
        </div>
      )}

      {/* Vault profiling banner — softer prompt after profile is done */}
      {isAuthenticated && completion?.isComplete && overall && !overall.isFullyProfiled && location.pathname !== '/vaults' && (
        <div
          className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white cursor-pointer hover:opacity-95 transition-opacity"
          onClick={() => navigate('/vaults')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/vaults') }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">
              ✨ Discover your investor DNA — profile your vaults to get personalised matches!
            </p>
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
