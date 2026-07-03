import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Menu, X, PieChart, Sparkles, Vault } from 'lucide-react'
import {
  Show,
  SignInButton,
} from '@clerk/react'
import ProfileIndicator from '@/components/ProfileIndicator'
import OnboardingVideo from '@/components/OnboardingVideo'
import { useUserStore } from '@/stores/user.store'
import { useThemeStore } from '@/stores/theme.store'

import WLogo3D from '@/components/ui/WLogo3D'

const AUTH_NAV_LINKS = [
  { label: 'Vaults', href: '/vaults', icon: Vault },
  { label: 'Portfolio', href: '/portfolio', icon: PieChart, roles: ['investor', 'admin', 'super_admin'] },
  { label: 'My Listings', href: '/portal/builder/listings', icon: Sparkles, roles: ['admin', 'super_admin'] },
] as const

interface NavbarProps {
  /** @deprecated Props-based user is no longer needed — Clerk manages auth state. */
  user?: null
}

export default function Navbar(_props?: NavbarProps) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const userRole = useUserStore((s) => s.user?.role)
  const userRoles = useUserStore((s) => s.user?.roles ?? [])
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)

  useThemeStore((s) => s.theme)

  // ── Scroll behaviour (all pages) ───────────────────────────────────────
  const [navVisible, setNavVisible] = useState(true)
  // onDark = navbar is sitting over a dark hero background (white text needed)
  const [onDark, setOnDark] = useState(true)
  const lastScrollY = useRef(0)



  useEffect(() => {
    // Reset on route change
    setNavVisible(true)
    lastScrollY.current = window.scrollY

    const onScroll = () => {
      const current = window.scrollY
      const delta = current - lastScrollY.current
      
      // Handle visibility
      if (current <= 10) setNavVisible(true)
      else if (delta > 5 && current > 80) setNavVisible(false)
      else if (delta < -5) setNavVisible(true)
      
      lastScrollY.current = current

      // Handle dark/light mode based on scroll position.
      // Some pages are entirely dark — keep nav transparent regardless of scroll.
      const alwaysDark = ['/create-opportunity'].some((p) => location.pathname.startsWith(p))
      if (alwaysDark) {
        setOnDark(true)
      } else if (current > 60) {
        setOnDark(false)
      } else {
        setOnDark(true)
      }
    }
    
    // Initial check
    onScroll()
    
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [location.pathname])

  const isAdminOrSuper = userRoles.includes('admin') || userRoles.includes('super_admin')
  const extraLinks = [
    ...(isAdminOrSuper ? [{ label: 'Dashboards & Reports', href: '/reports' }] : []),
    ...(userRoles.includes('super_admin') ? [{ label: 'Control Centre', href: '/control-centre' }] : []),
  ]
  const filteredAuthLinks = AUTH_NAV_LINKS.filter((link) => {
    if (!('roles' in link) || !link.roles) return true
    const allowed = link.roles as readonly string[]
    // Check primary role AND multi-role array
    const roleMatch = (userRole && allowed.includes(userRole)) || userRoles.some((r) => allowed.includes(r))
    if (!roleMatch) return false
    return true
  })
  const allNavLinks = [...filteredAuthLinks, ...extraLinks, { label: 'How We Work', href: '/how-we-work' }, { label: 'Knowledge Hub', href: '/knowledge-hub' }, { label: 'About', href: '/about' }]
  const publicNavLinks = [{ label: 'How We Work', href: '/how-we-work' }, { label: 'Knowledge Hub', href: '/knowledge-hub' }, { label: 'About', href: '/about' }]
  const visibleNavLinks = isAuthenticated ? allNavLinks : publicNavLinks

  // ── Pill nav link classes (consistent across all links) ────────────────
  const pillLink = (isActive: boolean) =>
    isActive
      ? 'px-4 py-1.5 rounded-full border border-[#D4AF37] bg-[#D4AF37] text-[#0D1324] font-semibold'
      : onDark
        ? 'px-4 py-1.5 rounded-full border border-white/70 text-white font-medium hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
        : 'px-4 py-1.5 rounded-full border border-slate-400 text-slate-800 font-medium hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'

  return (
    <>
    <header
      className={cn(
        'z-50 w-full fixed top-0 transition-all duration-300',
        !onDark ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm' : 'bg-transparent border-b border-transparent'
      )}
      style={{
        transform: !navVisible ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      <nav className="w-full px-4 sm:px-8 lg:px-12" aria-label="Main navigation">
        <div className="flex h-[72px] md:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/vaults" className="flex items-center gap-1.5 shrink-0" aria-label="WealthSpot Home">
            <WLogo3D size={72} light={onDark} className="transition-all duration-300" />
            <div className="flex flex-col justify-center">
              <span className={cn('text-2xl sm:text-[28px] font-bold tracking-tight leading-none', onDark ? 'text-white' : 'text-slate-950')} 
                style={{ fontFamily: 'Constantia, Cambria, Georgia, serif' }}
              >
                Wealth<span className="text-[#D4AF37]">Spot</span>
              </span>
              <span className={cn('whitespace-nowrap text-[8.5px] sm:text-[11px] font-semibold tracking-[0.15em] sm:tracking-[0.2em] leading-none mt-1', onDark ? 'text-white/70' : 'text-slate-500')}>
                Research. Evaluate. Invest.
              </span>
            </div>
          </Link>

          {/* Desktop Nav — all pills, consistent style */}
          <div className="hidden md:flex items-center gap-3 ml-10">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn('text-sm transition-all duration-200', pillLink(location.pathname === link.href))}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            
            {/* Clerk auth: signed-in → Create Opp + UserButton, signed-out → Sign In / Sign Up */}
            <Show when="signed-in">
              <ProfileIndicator size="sm" />
            </Show>
            <Show when="signed-out">
              <div className="hidden sm:flex items-center gap-3">
                <SignInButton mode="modal" forceRedirectUrl="/vaults">
                  <button className="text-[#D4AF37] text-sm font-medium px-4 py-2 rounded-[14px] border border-[#D4AF37]/60 bg-transparent hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all">Sign In</button>
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
                <X className={cn('h-6 w-6', onDark ? 'text-white' : 'text-slate-900/80')} />
              ) : (
                <Menu className={cn('h-6 w-6', onDark ? 'text-white' : 'text-slate-900/80')} />
              )}
            </button>
          </div> {/* end right actions */}
        </div> {/* end flex row */}
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden animate-fade-up"
          style={{
            background: onDark ? 'rgba(10,30,40,0.85)' : 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: onDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(15,23,42,0.08)',
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
                    : onDark
                      ? 'border border-white/40 text-white hover:border-[#D4AF37] hover:text-[#D4AF37]'
                      : 'border border-slate-400 text-slate-800 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Show when="signed-in">
              <div className="pt-3 border-t border-white/20" />
            </Show>
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