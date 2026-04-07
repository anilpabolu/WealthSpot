import { Link } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'

/**
 * 404 – Not Found page.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Hero */}
      <section className="page-hero bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex-1 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          {/* 404 illustration */}
          <div className="relative mb-8">
            <span className="text-[10rem] leading-none font-display font-bold text-white/10 select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="card px-8 py-6">
                <Search className="h-12 w-12 text-primary mx-auto mb-3" />
                <p className="text-gray-900 font-semibold text-lg">Page not found</p>
              </div>
            </div>
          </div>

          <p className="text-white/60 text-sm mb-8 max-w-sm mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved. 
            Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="btn-gradient bg-gradient-to-r from-[#D4AF37] to-[#B8860B] inline-flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors border border-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
