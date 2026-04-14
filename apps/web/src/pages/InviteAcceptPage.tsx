import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiPost } from '@/lib/api'
import Navbar from '@/components/layout/Navbar'

type Status = 'loading' | 'success' | 'error'

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invite link.')
      return
    }

    apiPost<{ message: string }>(`/control-centre/accept-invite/${token}`)
      .then((res) => {
        setStatus('success')
        setMessage(res.message ?? 'Invite accepted! You now have admin access.')
      })
      .catch((err) => {
        setStatus('error')
        const msg = err?.response?.data?.detail ?? 'Failed to accept invite. It may be expired or already used.'
        setMessage(msg)
      })
  }, [token])

  return (
    <div className="min-h-screen bg-theme-surface flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full rounded-xl border border-theme bg-[var(--bg-surface)] p-8 text-center space-y-4">
          {status === 'loading' && (
            <>
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-theme-secondary">Accepting invite…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">✓</div>
              <h2 className="text-lg font-bold text-theme-primary">Welcome!</h2>
              <p className="text-sm text-theme-secondary">{message}</p>
              <button
                onClick={() => navigate('/control-centre')}
                className="mt-4 px-6 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                Go to Control Centre
              </button>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="h-12 w-12 rounded-full bg-red-50 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto text-xl font-bold">✕</div>
              <h2 className="text-lg font-bold text-theme-primary">Invite Failed</h2>
              <p className="text-sm text-theme-secondary">{message}</p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 px-6 py-2.5 rounded-lg border border-theme text-theme-secondary text-sm font-medium hover:bg-theme-surface transition-colors"
              >
                Go Home
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
