import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react'

const BUILDER_NAV = [
  { label: 'Dashboard',    href: '/portal/builder',                  icon: LayoutDashboard },
  { label: 'My Listings',  href: '/portal/builder/listings',         icon: Building2 },
  { label: 'Investors',    href: '/portal/builder/investors',        icon: Users },
  { label: 'Documents',    href: '/portal/builder/documents',        icon: FileText },
]

const BUILDER_BOTTOM = [
  { label: 'Settings', href: '/portal/builder/settings', icon: Settings },
  { label: 'Help',     href: '/portal/builder/help',     icon: HelpCircle },
]

/**
 * Pill link:
 *   inactive : light border + gray text
 *   hover    : gold border + gold text + subtle gold bg
 *   active   : solid gold bg + dark text (filled pill)
 */
const pillCls = (isActive: boolean) =>
  cn(
    'flex items-center gap-2.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200',
    isActive
      ? 'border border-[#D4AF37] bg-[#D4AF37] text-[#0D1324] font-semibold shadow-md'
      : 'border border-gray-200 text-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
  )

export default function BuilderSidebar() {
  const location = useLocation()

  return (
    <aside
      className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 sticky top-16 h-[calc(100dvh-4rem)] overflow-hidden bg-white border-r border-gray-200"
    >
      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col h-full overflow-y-auto pt-16">

        {/* Builder badge */}
        <div className="px-4 pt-5 pb-3">
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50"
          >
            <div
              className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(212,175,55,0.18)' }}
            >
              <Building2 className="h-4.5 w-4.5 text-[#D4AF37]" style={{ height: '1.1rem', width: '1.1rem' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Builder Portal</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Manage your properties</p>
            </div>
          </div>
        </div>

        {/* ── Main nav ── */}
        <nav className="flex-1 px-3 pt-1 space-y-1 overflow-y-auto" aria-label="Builder navigation">
          {BUILDER_NAV.map((item) => {
            const isActive =
              item.href === '/portal/builder'
                ? location.pathname === '/portal/builder'
                : location.pathname.startsWith(item.href)

            return (
              <NavLink key={item.href} to={item.href} className={pillCls(isActive)}>
                <item.icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-[#0D1324]' : 'text-gray-500'
                  )}
                />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* ── Bottom nav ── */}
        <div className="px-3 pb-5 pt-2 space-y-1">
          {/* Thin gold divider */}
          <div
            className="mx-1 mb-2 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.4) 50%, transparent 100%)',
            }}
          />
          {BUILDER_BOTTOM.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => pillCls(isActive)}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-[#0D1324]' : 'text-gray-500'
                    )}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </aside>
  )
}
