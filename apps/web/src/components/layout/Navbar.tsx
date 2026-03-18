import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Shield, Search, Menu, X } from 'lucide-react'
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/react'

const NAV_LINKS = [
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'How it Works', href: '/#how-it-works' },
  { label: 'Community', href: '/community' },
  { label: 'Referrals', href: '/referral' },
]

interface NavbarProps {
  /** @deprecated Props-based user is no longer needed — Clerk manages auth state. */
  user?: null
}

export default function Navbar(_props?: NavbarProps) {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="WealthSpot Home">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-display text-xl font-bold tracking-tight text-gray-900">
              Wealth<span className="text-primary">Spot</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8 ml-10">
            {NAV_LINKS.map((link) => (
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

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Search properties"
            >
              <Search className="h-5 w-5 text-gray-500" />
            </button>

            {/* Clerk auth: signed-in → UserButton, signed-out → Sign In / Sign Up */}
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8 ring-2 ring-primary/20',
                  },
                }}
              />
            </Show>
            <Show when="signed-out">
              <div className="hidden sm:flex items-center gap-2">
                <SignInButton mode="modal">
                  <button className="btn-ghost text-sm">Sign In</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="btn-primary text-sm">Get Started</button>
                </SignUpButton>
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

        {/* Search bar (collapsible) */}
        {searchOpen && (
          <div className="py-3 border-t border-gray-100 animate-fade-up">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search properties by name, city, or RERA number..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                autoFocus
              />
            </div>
          </div>
        )}
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 animate-fade-up">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
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
            <Show when="signed-out">
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <SignInButton mode="modal">
                  <button
                    className="btn-ghost text-sm flex-1 text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button
                    className="btn-primary text-sm flex-1 text-center"
                    onClick={() => setMobileOpen(false)}
                  >
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            </Show>
          </div>
        </div>
      )}
    </header>
  )
}
