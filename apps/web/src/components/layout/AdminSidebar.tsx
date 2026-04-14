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

export default function AdminSidebar() {
  const location = useLocation()

  return (
    <aside className="hidden lg:flex flex-col w-64 backdrop-blur-xl border-r h-[calc(100vh-64px)] sticky top-16 transition-colors duration-300" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--bg-sidebar-border)' }}>
      {/* Admin badge */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-500/10 dark:bg-red-500/15">
            <ShieldCheck className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-theme-primary">Admin Panel</p>
            <p className="text-xs text-theme-secondary">Platform management</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Admin navigation">
        {ADMIN_NAV.map((item) => {
          const isActive =
            item.href === '/portal/admin'
              ? location.pathname === '/portal/admin'
              : location.pathname.startsWith(item.href)

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--text-accent)]/10 text-theme-accent shadow-sm'
                  : 'text-theme-secondary hover:bg-[var(--bg-surface-hover)] hover:text-theme-primary'
              )}
            >
              <item.icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-theme-accent' : 'text-theme-tertiary')} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--border-default)' }}>
        {ADMIN_BOTTOM.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-theme-secondary hover:bg-[var(--bg-surface-hover)] hover:text-theme-primary transition-all duration-200"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
