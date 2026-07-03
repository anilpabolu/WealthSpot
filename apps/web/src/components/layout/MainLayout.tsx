import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

interface MainLayoutProps {
  children?: ReactNode
  showFooter?: boolean
}

/**
 * Main layout wrapper with Navbar + Footer.
 * Used for public pages (Landing, Marketplace, Property Detail, Auth).
 */
export default function MainLayout({ children, showFooter = true }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-theme-surface transition-colors duration-300 overflow-x-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children ?? <Outlet />}
      </main>
      {showFooter && <Footer />}
    </div>
  )
}