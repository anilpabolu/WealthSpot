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
    <div className={`rounded-xl px-5 py-4 ${color}`}>
      <p className="text-2xl font-bold font-mono">{value}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
    </div>
  )
}
