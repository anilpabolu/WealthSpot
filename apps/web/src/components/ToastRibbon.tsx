import { useEffect, useRef } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useToastStore, type Toast, type ToastType } from '@/stores/toastStore'

const TYPE_STYLES: Record<ToastType, { bar: string; icon: string; IconEl: typeof CheckCircle2 }> = {
  success: {
    bar: 'bg-emerald-400',
    icon: 'text-emerald-400',
    IconEl: CheckCircle2,
  },
  error: {
    bar: 'bg-red-400',
    icon: 'text-red-400',
    IconEl: XCircle,
  },
  info: {
    bar: 'bg-sky-400',
    icon: 'text-sky-400',
    IconEl: Info,
  },
  warning: {
    bar: 'bg-amber-400',
    icon: 'text-amber-400',
    IconEl: AlertTriangle,
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast, dismissInterval } = useToastStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { bar, icon, IconEl } = TYPE_STYLES[toast.type]

  useEffect(() => {
    timerRef.current = setTimeout(() => removeToast(toast.id), dismissInterval)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [toast.id, dismissInterval, removeToast])

  return (
    <div
      className="relative flex items-start gap-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-md animate-in slide-in-from-right-8 duration-300 min-w-[280px] max-w-sm"
      role="alert"
    >
      {/* Left accent bar */}
      <span className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${bar}`} />

      <IconEl className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`} />

      <div className="flex-1 pr-1">
        <p className="text-sm font-semibold text-white leading-snug">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-xs text-white/70 leading-snug">{toast.message}</p>
        )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="mt-0.5 shrink-0 rounded p-0.5 text-white/50 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function ToastRibbon() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed right-4 top-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
