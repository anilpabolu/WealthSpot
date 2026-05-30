import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import InvestorSidebar from './InvestorSidebar'
import BuilderSidebar from './BuilderSidebar'
import AdminSidebar from './AdminSidebar'
import LenderSidebar from './LenderSidebar'
import { cn } from '@/lib/utils'

interface PortalLayoutProps {
  variant: 'investor' | 'builder' | 'admin' | 'lender'
  /**
   * Optional full-width hero section rendered in the main column.
   * Starts at top-0 so it bleeds under the transparent navbar.
   */
  hero?: ReactNode
  children?: ReactNode
}

/**
 * Portal layout: fixed Navbar + sticky Sidebar + Main Content.
 * 
 * Sidebar extends to top-0 to provide a dark background behind the transparent navbar.
 * Main content is pushed down by 4rem (pt-16) UNLESS a hero is provided, 
 * in which case the hero starts at top-0 to bleed under the navbar.
 */
export default function PortalLayout({ variant, hero, children }: PortalLayoutProps) {
  const Sidebar =
    variant === 'investor'
      ? InvestorSidebar
      : variant === 'builder'
        ? BuilderSidebar
        : variant === 'admin'
          ? AdminSidebar
          : variant === 'lender'
            ? LenderSidebar
            : null

  return (
    <div className="min-[100dvh] flex flex-col bg-theme-surface transition-colors duration-300">
      <Navbar />

      {/* Full-width hero rendered above the sidebar split */}
      {hero}

      <div className="flex flex-1 items-stretch relative">
        {/* Sidebar: natural document flow, sticky below navbar */}
        {Sidebar && <Sidebar />}

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 flex flex-col overflow-x-hidden min-w-0",
          variant === 'builder' && "bg-white"
        )}>
          <div className={cn("flex-1", !hero && "pt-16")}>
            {children ?? <Outlet />}
          </div>
        </main>
      </div>

      <Footer />
    </div>
  )
}
