import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MutationCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/react'
import * as Sentry from '@sentry/react'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { formatApiError } from './lib/apiError'
import { useToastStore } from './stores/toastStore'
import './index.css'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
  })
}

// `meta` shape consumed by the global mutation handlers below.
// Hooks set these to opt into automatic toasts:
//   useMutation({ ..., meta: { successMessage: 'Saved' } })
//   useMutation({ ..., meta: { silent: true } })  // suppress error toast
type MutationMeta = {
  successMessage?: string
  errorTitle?: string
  silent?: boolean
}

const mutationCache = new MutationCache({
  onError: (error, _vars, _ctx, mutation) => {
    const meta = (mutation.meta ?? {}) as MutationMeta
    if (meta.silent) return
    const formatted = formatApiError(error)
    useToastStore.getState().addToast({
      type: 'error',
      title: meta.errorTitle ?? formatted.title,
      message: formatted.message,
    })
  },
  onSuccess: (_data, _vars, _ctx, mutation) => {
    const meta = (mutation.meta ?? {}) as MutationMeta
    if (meta.silent || !meta.successMessage) return
    useToastStore.getState().addToast({
      type: 'success',
      title: meta.successMessage,
    })
  },
})

const queryClient = new QueryClient({
  mutationCache,
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HelmetProvider>
    <ClerkProvider
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
      afterSignOutUrl="/"
      appearance={{
        signIn: {
          elements: {
            footerActionText: {
              fontSize: '13px',
              color: '#D4AF37',
            },
            footerActionLink: {
              color: '#D4AF37',
              fontWeight: '600',
              '&:hover': { color: '#B8860B' },
            },
          },
        },
      }}
      localization={{
        signIn: {
          start: {
            actionText: 'New here?',
            actionLink: 'Sign up using Get Access',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ClerkProvider>
    </HelmetProvider>
  </React.StrictMode>,
)
