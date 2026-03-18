import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  Users,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  HelpCircle,
} from 'lucide-react'

const BUILDER_NAV = [
  { label: 'Dashboard', href: '/portal/builder', icon: LayoutDashboard },
  { label: 'My Listings', href: '/portal/builder/listings', icon: Building2 },
  { label: 'Add Property', href: '/portal/builder/listings/new', icon: PlusCircle },
  { label: 'Investors', href: '/portal/builder/investors', icon: Users },
  { label: 'Documents', href: '/portal/builder/documents', icon: FileText },
  { label: 'Analytics', href: '/portal/builder/analytics', icon: BarChart3 },
  { label: 'Messages', href: '/portal/builder/messages', icon: MessageSquare },
]

const BUILDER_BOTTOM = [
  { label: 'Settings', href: '/portal/builder/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: HelpCircle },
]

export default function BuilderSidebar() {
  const location = useLocation()

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-[calc(100vh-64px)] sticky top-16">
      {/* Builder badge */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Builder Portal</p>
            <p className="text-xs text-gray-500">Manage your properties</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Builder navigation">
        {BUILDER_NAV.map((item) => {
          const isActive =
            item.href === '/portal/builder'
              ? location.pathname === '/portal/builder'
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
        {BUILDER_BOTTOM.map((item) => (
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
