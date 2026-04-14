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
    <aside className="hidden lg:flex flex-col w-64 backdrop-blur-xl border-r h-[calc(100vh-64px)] sticky top-16 transition-colors duration-300" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--bg-sidebar-border)' }}>
      {/* Builder badge */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15">
            <Building2 className="h-5 w-5 text-theme-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-theme-primary">Builder Portal</p>
            <p className="text-xs text-theme-secondary">Manage your properties</p>
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
        {BUILDER_BOTTOM.map((item) => (
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
