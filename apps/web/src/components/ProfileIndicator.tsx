import { useUser, useClerk } from '@clerk/react'
import { useNavigate, Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useProfileCompletionStatus } from '@/hooks/useProfileAPI'
import { useUserStore } from '@/stores/user.store'
import { cn } from '@/lib/utils'
import {
  Check, Zap, Settings,
  LogOut, ChevronRight,
} from 'lucide-react'

interface ProfileIndicatorProps {
  size?: 'sm' | 'md'
}

const MENU_LINKS = [
  { label: 'Settings', href: '/settings', icon: Settings },
] as const

export default function ProfileIndicator({ size = 'sm' }: ProfileIndicatorProps) {
  const navigate = useNavigate()
  const { user: clerkUser } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  const storeUser = useUserStore((s) => s.user)
  const { data: completion, isLoading } = useProfileCompletionStatus()

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const avatarSize = size === 'md' ? 'h-9 w-9' : 'h-8 w-8'
  const pct = completion?.profileCompletionPct ?? 0
  const isComplete = completion?.isComplete ?? false

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const avatarUrl = clerkUser?.imageUrl
  const displayName = storeUser?.name || clerkUser?.fullName || 'User'
  const displayEmail = storeUser?.email || clerkUser?.primaryEmailAddress?.emailAddress || ''

  const AvatarButton = (
    <button
      onClick={() => setOpen((v) => !v)}
      className={cn(
        'rounded-full overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50',
        open ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200 hover:border-primary/50',
        avatarSize,
      )}
      aria-label="Open profile menu"
      aria-expanded={open}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}
    </button>
  )

  const Dropdown = open && (
    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
      {/* User info header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-10 w-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
            <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
          </div>
        </div>
        {!isComplete && !isLoading && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-amber-600 font-medium">{pct}% Profile Complete</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation links */}
      <div className="py-1">
        {MENU_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
            >
              <Icon className="h-4 w-4 text-gray-400" />
              <span className="flex-1">{link.label}</span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            </Link>
          )
        })}
      </div>

      {/* Bottom actions */}
      <div className="border-t border-gray-100 py-1">
        <button
          onClick={() => { setOpen(false); openUserProfile() }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Settings className="h-4 w-4 text-gray-400" />
          <span>Manage Account</span>
        </button>
        <button
          onClick={() => { setOpen(false); signOut() }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )

  if (isLoading || !isAuthenticated) {
    return (
      <div className="relative" ref={menuRef}>
        {AvatarButton}
        {Dropdown}
      </div>
    )
  }

  if (isComplete) {
    return (
      <div className="relative" ref={menuRef}>
        <div className="relative">
          {AvatarButton}
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 border-2 border-white shadow-sm pointer-events-none">
            <Check className="h-2 w-2 text-white stroke-[3]" />
          </span>
        </div>
        {Dropdown}
      </div>
    )
  }

  // Incomplete profile
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate('/profile/complete')}
        className={cn(
          'hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
          'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-200',
          'hover:shadow-lg hover:shadow-orange-300 hover:scale-[1.03] active:scale-100',
          'animate-pulse hover:animate-none',
        )}
      >
        <Zap className="h-3.5 w-3.5" />
        {pct}% — Complete Profile
      </button>
      <div className="relative" ref={menuRef}>
        <div className="relative">
          {AvatarButton}
          {/* Pulsing red dot */}
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>
        {Dropdown}
      </div>
    </div>
  )
}
