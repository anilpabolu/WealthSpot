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
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16">
      {/* Lender badge */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <Banknote className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Lender Portal</p>
            <p className="text-xs text-gray-500">Manage lending portfolio</p>
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
        {LENDER_BOTTOM.map((item) => (
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
