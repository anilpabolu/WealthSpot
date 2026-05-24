import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileCheck,
  ShieldCheck,
  BarChart3,
  Flag,
  Settings,
  AlertTriangle,
  Activity,
  Gift,
} from 'lucide-react'

import sidebarBg from '@/assets/sidebar-bg.avif'

const ADMIN_NAV = [
  { label: 'Overview', href: '/portal/admin', icon: LayoutDashboard },
  { label: 'Properties', href: '/portal/admin/properties', icon: Building2 },
  { label: 'Users', href: '/portal/admin/users', icon: Users },
  { label: 'KYC Queue', href: '/portal/admin/kyc', icon: FileCheck },
  { label: 'Referrals', href: '/portal/admin/referrals', icon: Gift },
  { label: 'Compliance', href: '/portal/admin/compliance', icon: ShieldCheck },
  { label: 'Analytics', href: '/portal/admin/analytics', icon: BarChart3 },
  { label: 'Reports', href: '/portal/admin/reports', icon: Flag },
  { label: 'Audit Log', href: '/portal/admin/audit', icon: Activity },
  { label: 'Alerts', href: '/portal/admin/alerts', icon: AlertTriangle },
]

const ADMIN_BOTTOM = [
  { label: 'Platform Settings', href: '/portal/admin/settings', icon: Settings },
]

const pillCls = (isActive: boolean) =>
  cn(
    'flex items-center gap-2.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200',
    isActive
      ? 'border border-[#D4AF37] bg-[#D4AF37] text-[#0D1324] font-semibold shadow-md'
      : 'border border-white/55 text-white hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
  )

export default function AdminSidebar() {
  const location = useLocation()

  return (
    <aside
      className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 sticky top-16 h-[calc(100dvh-4rem)] overflow-hidden"
    >
      {/* ── Background image with dark overlay for text legibility ── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${sidebarBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Dark gradient overlay so white text stays readable */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-slate-950/80 via-slate-900/90 to-slate-950/95"
        aria-hidden="true"
      />

      {/* ── Content (z-10 to sit above background) ── */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Admin badge */}
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20 backdrop-blur-sm shadow-inner">
              <ShieldCheck className="h-5 w-5 text-red-400 drop-shadow-sm" />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">Admin Panel</p>
              <p className="text-xs text-white/60 font-medium">Platform management</p>
            </div>
          </div>
        </div>

        {/* Main nav */}
        <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto" aria-label="Admin navigation">
          {ADMIN_NAV.map((item) => {
            const isActive =
              item.href === '/portal/admin'
                ? location.pathname === '/portal/admin'
                : location.pathname.startsWith(item.href)

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={pillCls(isActive)}
              >
                <item.icon className={cn('h-4 w-4', isActive ? 'text-[#0D1324]' : 'text-white/70')} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom nav */}
        <div className="p-4 space-y-2">
          {ADMIN_BOTTOM.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={pillCls(isActive)}
              >
                <item.icon className={cn('h-4 w-4', isActive ? 'text-[#0D1324]' : 'text-white/70')} />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
