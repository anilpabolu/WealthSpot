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
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16">
      {/* Admin badge */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-danger" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Admin Panel</p>
            <p className="text-xs text-gray-500">Platform management</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Admin navigation">
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
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/5 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-gray-400')} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        {ADMIN_BOTTOM.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
