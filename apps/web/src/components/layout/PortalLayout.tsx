import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import InvestorSidebar from './InvestorSidebar'
import BuilderSidebar from './BuilderSidebar'
import AdminSidebar from './AdminSidebar'
import LenderSidebar from './LenderSidebar'

interface PortalLayoutProps {
  variant: 'investor' | 'builder' | 'admin' | 'lender'
  children?: ReactNode
}

/**
 * Portal layout with Navbar + Sidebar.
 * Used for all dashboard pages.
 */
export default function PortalLayout({ variant, children }: PortalLayoutProps) {
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
    <div className="min-h-screen flex flex-col bg-theme-base transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1">
        {Sidebar && <Sidebar />}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children ?? <Outlet />}
        </main>
      </div>
      <Footer />
    </div>
  )
}
