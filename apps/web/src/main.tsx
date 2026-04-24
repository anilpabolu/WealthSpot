import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ClerkProvider } from '@clerk/react'
import * as Sentry from '@sentry/react'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
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

const queryClient = new QueryClient({
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
