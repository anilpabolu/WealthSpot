import { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

interface MainLayoutProps {
  children?: ReactNode
}

/**
 * Main layout wrapper with Navbar + Footer.
 * Used for public pages (Landing, Marketplace, Property Detail, Auth).
 */
export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-theme-base transition-colors duration-300">
      <Navbar />
      <main className="flex-1">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </div>
  )
}
