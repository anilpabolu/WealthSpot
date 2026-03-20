import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  PieChart,
  Building2,
  Receipt,
  Landmark,
  FileCheck,
  Users,
  Share2,
  Bell,
  Settings,
  HelpCircle,
} from 'lucide-react'
import { useUserStore } from '@/stores/user.store'

const INVESTOR_NAV = [
  { label: 'Dashboard', href: '/portal/investor', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/portal/investor/portfolio', icon: PieChart },
  { label: 'Marketplace', href: '/marketplace', icon: Building2 },
  { label: 'Transactions', href: '/portal/investor/transactions', icon: Receipt },
  { label: 'Lend', href: '/portal/investor/lender', icon: Landmark },
  { label: 'KYC Status', href: '/auth/kyc/identity', icon: FileCheck },
  { label: 'Community', href: '/community', icon: Users, roles: ['super_admin'] as string[] },
  { label: 'Refer & Earn', href: '/referral', icon: Share2 },
]

const INVESTOR_BOTTOM = [
  { label: 'Notifications', href: '/portal/investor/notifications', icon: Bell },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help Center', href: '/help', icon: HelpCircle },
]

export default function InvestorSidebar() {
  const location = useLocation()
  const userRole = useUserStore((s) => s.user?.role)

  const visibleNav = INVESTOR_NAV.filter((item) => {
    if (!('roles' in item) || !item.roles) return true
    return userRole && item.roles.includes(userRole)
  })

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16">
      {/* Investor badge */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <PieChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Investor Portal</p>
            <p className="text-xs text-gray-500">Manage your investments</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Investor navigation">
        {visibleNav.map((item) => {
          const isActive =
            item.href === '/portal/investor'
              ? location.pathname === '/portal/investor'
              : location.pathname.startsWith(item.href)

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/5 text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
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
        {INVESTOR_BOTTOM.map((item) => (
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
