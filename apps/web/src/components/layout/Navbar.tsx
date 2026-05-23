import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Menu, X, Plus, PieChart, Zap, Sparkles, Vault } from 'lucide-react'
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
  const [navVisible, setNavVisible] = useState(true)
  const [isHeaderLight, setIsHeaderLight] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    // Reset state on route change
    setNavVisible(true)
    lastScrollY.current = window.scrollY

    const onScroll = () => {
      const current = window.scrollY
      const delta = current - lastScrollY.current
      if (current <= 10) setNavVisible(true)
      // Hide when scrolling down past 80px threshold; show on any upward movement
      else if (delta > 5 && current > 80) setNavVisible(false)
      else if (delta < -5) setNavVisible(true)
      lastScrollY.current = current
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [location.pathname])

  useEffect(() => {
    const updateHeaderMode = () => {
      const hero = document.getElementById('hero')
      // Keep header light (transparent/white-text) on pages that extend behind it
      // (landing and vaults) so the navbar matches landing behaviour even if
      // hero geometry is not yet available or content loads late.
      if (!hero) {
        if (location.pathname === '/' || location.pathname.startsWith('/vaults')) {
          setIsHeaderLight(true)
        } else {
          setIsHeaderLight(false)
        }
        return
      }

      const heroBottom = hero.getBoundingClientRect().bottom
      setIsHeaderLight(heroBottom > 72 || location.pathname === '/' || location.pathname.startsWith('/vaults'))
    }

    updateHeaderMode()
    window.addEventListener('scroll', updateHeaderMode, { passive: true })
    return () => window.removeEventListener('scroll', updateHeaderMode)
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
  const allNavLinks = [...filteredAuthLinks, ...extraLinks, { label: 'About', href: '/about' }]
  const publicNavLinks = [{ label: 'About', href: '/about' }]
  const visibleNavLinks = isAuthenticated ? allNavLinks : publicNavLinks

  // ── Pill nav link classes (consistent across all links) ────────────────
  const pillLink = (isActive: boolean) =>
    isActive
      ? 'px-4 py-1.5 rounded-full border border-[#D4AF37] bg-[#D4AF37] text-[#0D1324] font-semibold'
      : isHeaderLight
        ? 'px-4 py-1.5 rounded-full border border-white/50 text-white font-medium hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
        : 'px-4 py-1.5 rounded-full border border-slate-300 text-slate-700 font-medium hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'

  return (
    <>
    <header
      className={cn('z-50 w-full fixed top-0')}
      style={{
        transform: !navVisible ? 'translateY(-100%)' : 'translateY(0)',
        transition: 'transform 0.35s ease',
        background: isHeaderLight ? 'transparent' : 'rgba(255,255,255,0.95)',
        backdropFilter: isHeaderLight ? 'none' : 'blur(18px)',
        WebkitBackdropFilter: isHeaderLight ? 'none' : 'blur(18px)',
        borderBottom: isHeaderLight ? 'none' : '1px solid rgba(15,23,42,0.06)',
      }}
    >
      <nav className="w-full px-8 sm:px-12" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/vaults" className="flex items-center gap-0.5 shrink-0" aria-label="WealthSpot Home">
            <WLogo3D size={54} light={isHeaderLight} className="transition-all duration-300" />
            <div className="flex flex-col">
              <span
                className={cn(
                  'text-2xl font-bold tracking-tight leading-none',
                  isHeaderLight ? 'text-white' : 'text-slate-950'
                )}
                style={{ fontFamily: 'Constantia, Cambria, Georgia, serif' }}
              >
                Wealth<span className="text-[#D4AF37]">Spot</span>
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold uppercase tracking-[0.25em] leading-none mt-1',
                  isHeaderLight ? 'text-white/70' : 'text-slate-500'
                )}
              >
                Private Wealth Access
              </span>
            </div>
          </Link>

          {/* Desktop Nav — all pills, consistent style */}
          <div className="hidden md:flex items-center gap-3 ml-10">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'text-sm transition-all duration-200',
                  pillLink(location.pathname === link.href)
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">

            {/* Clerk auth: signed-in → Create Opp + UserButton, signed-out → Sign In / Sign Up */}
            <Show when="signed-in">
              {(userRoles.includes('builder') || userRoles.includes('admin') || userRoles.includes('super_admin')) && (
              <button
                onClick={() => navigate('/create-opportunity')}
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-[#D4AF37] hover:text-[#0D1324] hover:font-semibold transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Create Opportunity
              </button>
              )}
              <ProfileIndicator size="sm" />
            </Show>
            <Show when="signed-out">
              <div className="hidden sm:flex items-center gap-3">
                <SignInButton mode="modal" forceRedirectUrl="/vaults">
                  <button className="text-[#D4AF37] text-sm font-medium px-4 py-2 rounded-[14px] border border-[#D4AF37] bg-transparent hover:bg-[#D4AF37] hover:text-[#0D1324] hover:font-semibold transition-all">Sign In</button>
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
                <X className={cn('h-6 w-6', isHeaderLight ? 'text-white' : 'text-slate-900/80')} />
              ) : (
                <Menu className={cn('h-6 w-6', isHeaderLight ? 'text-white' : 'text-slate-900/80')} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden animate-fade-up"
          style={{
            background: isHeaderLight ? 'rgba(10,30,40,0.85)' : 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: isHeaderLight ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.08)',
          }}
        >
          <div className="px-4 py-4 space-y-2">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'block px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                  location.pathname === link.href
                    ? 'border border-[#D4AF37] bg-[#D4AF37] text-[#0D1324] font-semibold'
                    : isHeaderLight
                      ? 'border border-white/40 text-white hover:border-[#D4AF37] hover:text-[#D4AF37]'
                      : 'border border-slate-300 text-slate-700 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Show when="signed-out">
              <div className="pt-3 border-t border-white/20 space-y-2">
                <div className="flex gap-2">
                <SignInButton mode="modal" forceRedirectUrl="/vaults">
                  <button
                    className="text-[#D4AF37] text-sm font-medium flex-1 text-center px-3 py-2 rounded-[14px] border border-[#D4AF37] bg-transparent hover:bg-[#D4AF37] hover:text-[#0D1324] hover:font-semibold transition-all"
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