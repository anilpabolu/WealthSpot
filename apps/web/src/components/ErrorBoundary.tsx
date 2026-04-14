import { Component, type ReactNode, type ErrorInfo } from 'react'
import * as Sentry from '@sentry/react'
import { Home, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Global error boundary – catches unhandled render errors
 * and displays a friendly fallback UI.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } })
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-theme-surface px-4">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>

            <h1 className="text-theme-primary font-display font-bold text-2xl mb-2">
              Something went wrong
            </h1>
            <p className="text-theme-secondary text-sm mb-6">
              An unexpected error occurred. Our team has been notified. 
              Please try refreshing the page.
            </p>

            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-gray-900 text-red-400 p-4 rounded-xl mb-6 overflow-x-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex items-center gap-2 bg-[var(--bg-surface)] text-theme-primary px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-theme-surface transition-colors border border-theme"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
