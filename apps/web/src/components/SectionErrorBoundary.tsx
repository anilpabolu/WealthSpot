import { Component, type ReactNode, type ErrorInfo } from 'react'
import { RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
}

/**
 * Lightweight section-level error boundary.
 * Wraps a page section so a crash in one widget doesn't tear down the whole page.
 */
export default class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SectionError]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-red-200 dark:border-red-800/40 bg-red-50/50 dark:bg-red-900/20 px-6 py-8 text-center">
          <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">
            {this.props.fallbackTitle ?? 'This section failed to load'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="inline-flex items-center gap-1.5 text-xs text-theme-secondary hover:text-theme-primary mt-2"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
