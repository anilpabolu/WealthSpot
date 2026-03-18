import { Link } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'

/**
 * 404 – Not Found page.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        {/* 404 illustration */}
        <div className="relative mb-8">
          <span className="text-[10rem] leading-none font-display font-bold text-primary/10 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 px-8 py-6">
              <Search className="h-12 w-12 text-primary mx-auto mb-3" />
              <p className="text-gray-900 font-semibold text-lg">Page not found</p>
            </div>
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. 
          Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 bg-white text-gray-700 px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
