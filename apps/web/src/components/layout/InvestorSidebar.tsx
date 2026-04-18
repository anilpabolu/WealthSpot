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
  Vault,
} from 'lucide-react'
import { useUserStore } from '@/stores/user.store'
import { useProfileCompletionStatus } from '@/hooks/useProfileAPI'

const INVESTOR_NAV = [
  { label: 'Dashboard', href: '/portal/investor', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/portal/investor/portfolio', icon: PieChart },
  { label: 'Marketplace', href: '/marketplace', icon: Building2 },
  { label: 'Vaults', href: '/vaults', icon: Vault },
  { label: 'Transactions', href: '/portal/investor/transactions', icon: Receipt, requiresProfile: true },
  { label: 'Lend', href: '/portal/investor/lender', icon: Landmark, requiresProfile: true },
  { label: 'KYC Status', href: '/settings?tab=kyc', icon: FileCheck },
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
  const { data: profileStatus } = useProfileCompletionStatus()

  const visibleNav = INVESTOR_NAV.filter((item) => {
    if ('roles' in item && item.roles) {
      if (!userRole || !item.roles.includes(userRole)) return false
    }
    if ('requiresProfile' in item && item.requiresProfile) {
      if (!profileStatus?.isComplete) return false
    }
    return true
  })

  return (
    <aside className="hidden lg:flex flex-col w-64 backdrop-blur-xl border-r h-[calc(100vh-64px)] sticky top-16 transition-colors duration-300" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--bg-sidebar-border)' }}>
      {/* Investor badge */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15">
            <PieChart className="h-5 w-5 text-theme-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-theme-primary">Investor Portal</p>
            <p className="text-xs text-theme-secondary">Manage your investments</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" aria-label="Investor navigation">
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
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-[var(--text-accent)]/10 text-theme-accent shadow-sm'
                  : 'text-theme-secondary hover:bg-[var(--bg-surface-hover)] hover:text-theme-primary',
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
        {INVESTOR_BOTTOM.map((item) => (
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
