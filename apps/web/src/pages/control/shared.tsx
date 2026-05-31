import { Loader2 } from 'lucide-react'

export function CenteredLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  )
}

export function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl border border-[rgba(209,196,157,0.25)] px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${color}`}>
      <p className="text-2xl font-bold font-mono">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wider mt-1 opacity-70">{label}</p>
    </div>
  )
}

export function SectionHeading({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <h2 className="font-display text-base font-bold text-[var(--text-primary)] uppercase tracking-wider">{children}</h2>
      <div className="flex-1 h-px bg-[rgba(209,196,157,0.25)]" />
    </div>
  )
}
