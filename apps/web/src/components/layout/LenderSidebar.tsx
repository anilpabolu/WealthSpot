import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Wallet,
  FileText,
  TrendingUp,
  CalendarClock,
  Settings,
  HelpCircle,
  Banknote,
} from 'lucide-react'

const LENDER_NAV = [
  { label: 'Dashboard', href: '/portal/investor/lender', icon: LayoutDashboard },
  { label: 'Active Loans', href: '/portal/investor/lender/loans', icon: Banknote },
  { label: 'Opportunities', href: '/portal/investor/lender/opportunities', icon: TrendingUp },
  { label: 'Portfolio', href: '/portal/investor/lender/portfolio', icon: Wallet },
  { label: 'Repayments', href: '/portal/investor/lender/repayments', icon: CalendarClock },
  { label: 'Documents', href: '/portal/investor/lender/documents', icon: FileText },
]

const LENDER_BOTTOM = [
  { label: 'Settings', href: '/portal/investor/lender/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: HelpCircle },
]

export default function LenderSidebar() {
  const location = useLocation()

  return (
    <aside className="hidden lg:flex flex-col w-64 backdrop-blur-xl border-r h-[calc(100vh-64px)] sticky top-16 transition-colors duration-300" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--bg-sidebar-border)' }}>
      {/* Lender badge */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-500/15">
            <Banknote className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-theme-primary">Lender Portal</p>
            <p className="text-xs text-theme-secondary">Manage lending portfolio</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Lender navigation">
        {LENDER_NAV.map((item) => {
          const isActive =
            item.href === '/portal/investor/lender'
              ? location.pathname === '/portal/investor/lender'
              : location.pathname.startsWith(item.href)

          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--text-accent)]/10 text-theme-accent'
                  : 'text-theme-secondary hover:bg-[var(--bg-surface-hover)] hover:text-theme-primary'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-theme-accent' : 'text-theme-tertiary')} />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--border-default)' }}>
        {LENDER_BOTTOM.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-theme-secondary hover:bg-[var(--bg-surface-hover)] hover:text-theme-primary transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
