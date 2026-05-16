import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Menu, X, Plus, PieChart, MessageCircle, Zap, Sparkles, Vault } from 'lucide-react'
import {
  Show,
  SignInButton,
} from '@clerk/react'
import ProfileIndicator from '@/components/ProfileIndicator'
import OnboardingVideo from '@/components/OnboardingVideo'
import { useUserStore } from '@/stores/user.store'
import { useThemeStore } from '@/stores/theme.store'
import { useProfileCompletionStatus } from '@/hooks/useProfileAPI'
import { useOverallProgress } from '@/hooks/useProfiling'
import WLogo3D from '@/components/ui/WLogo3D'

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
  const userRole = useUserStore((s) => s.user?.role)
  const userRoles = useUserStore((s) => s.user?.roles ?? [])
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const { data: completion } = useProfileCompletionStatus()
  const { data: overall } = useOverallProgress()
  useThemeStore((s) => s.theme)

  // ── Scroll behaviour (all pages) ───────────────────────────────────────
  const isLanding = location.pathname === '/'
  const [isAtTop, setIsAtTop] = useState(true)
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    // Reset state on route change
    setIsAtTop(window.scrollY <= 10)
    setNavVisible(true)
    lastScrollY.current = window.scrollY

    const onScroll = () => {
      const current = window.scrollY
      const delta = current - lastScrollY.current
      if (current <= 10) {
        setIsAtTop(true)
        setNavVisible(true)
      } else {
        setIsAtTop(false)
        // Hide when scrolling down past 80px threshold; show on any upward movement
        if (delta > 5 && current > 80) setNavVisible(false)
        else if (delta < -5) setNavVisible(true)
      }
      lastScrollY.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

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

  // Portal pages have light-cream backgrounds — always keep nav opaque there
  const isPortal = location.pathname.startsWith('/portal/')

  // Background: landing fully transparent at top; portals always opaque; everything else semi-transparent at top
  const bgAtTop = isLanding
    ? 'rgba(0, 0, 0, 0)'
    : isPortal
      ? 'rgba(38, 50, 50, 0.88)'
      : 'rgba(38, 50, 50, 0.4)'
  const blurAtTop = isLanding ? 'none' : isPortal ? 'blur(8px)' : 'blur(4px)'
  const borderAtTop = isLanding
    ? '1px solid rgba(56,73,73,0)'
    : isPortal
      ? '1px solid rgba(255,255,255,0.08)'
      : '1px solid rgba(255,255,255,0.05)'

  return (
    <>
    <header
      className="z-50 w-full fixed top-0"
      style={{
        transform: !navVisible ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.35s ease, background 0.3s ease-in-out, backdrop-filter 0.3s ease-in-out, -webkit-backdrop-filter 0.3s ease-in-out',
        background: isAtTop ? bgAtTop : 'rgba(38, 50, 50, 0.88)',
        backdropFilter: isAtTop ? blurAtTop : 'blur(8px)',
        WebkitBackdropFilter: isAtTop ? blurAtTop : 'blur(8px)',
        borderBottom: isAtTop ? borderAtTop : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <nav className="w-full px-8 sm:px-12" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/vaults" className="flex items-center gap-3 shrink-0" aria-label="WealthSpot Home">
            <WLogo3D size={88} light />
            <div className="flex flex-col">
              <span
                className="text-2xl font-bold tracking-tight text-white leading-none"
                style={{ fontFamily: 'Constantia, Cambria, Georgia, serif' }}
              >
                Wealth<span className="text-[#D4AF37]">Spot</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/50 leading-none mt-1">
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
                      ? 'text-white after:absolute after:-bottom-[1.19rem] after:left-0 after:right-0 after:h-[2px] after:bg-[#D4AF37] after:rounded-full'
                      : 'text-white/70 hover:text-white'
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
              {(userRoles.includes('builder') || userRoles.includes('admin') || userRoles.includes('super_admin')) && (
              <button
                onClick={() => navigate('/create-opportunity')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-semibold shadow-[0_2px_8px_rgba(99,102,241,0.35)] hover:shadow-[0_4px_16px_rgba(99,102,241,0.45)] hover:brightness-110 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Opportunity
              </button>
              )}
              <ProfileIndicator size="sm" />
            </Show>
            <Show when="signed-out">
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/about"
                  className="text-white/75 hover:text-white text-sm font-medium transition-colors"
                >
                  About
                </Link>
                <SignInButton mode="modal" forceRedirectUrl="/vaults">
                  <button className="text-white/80 hover:text-white text-sm font-semibold px-4 py-2 rounded-[14px] border border-white/30 hover:bg-white/10 transition-all">Sign In</button>
                </SignInButton>
              </div>
            </Show>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <X className="h-6 w-6 text-white/80" />
              ) : (
                <Menu className="h-6 w-6 text-white/80" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden backdrop-blur-xl border-t border-white/10 animate-fade-up" style={{ background: 'rgba(56, 73, 73, 0.95)' }}>
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
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

            </Show>
            <Show when="signed-out">
              <div className="pt-3 border-t border-white/10 space-y-2">
                <Link
                  to="/about"
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  About
                </Link>
                <div className="flex gap-2">
                <SignInButton mode="modal" forceRedirectUrl="/vaults">
                  <button
                    className="text-white/80 hover:text-white text-sm font-semibold flex-1 text-center px-3 py-2 rounded-[14px] border border-white/30 hover:bg-white/10 transition-all"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </button>
                </SignInButton>
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

    </>
  )
}
