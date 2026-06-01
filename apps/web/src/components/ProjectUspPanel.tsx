import { MapPin } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  mall: 'Shopping Mall',
  commercial_complex: 'Commercial Complex',
  metro: 'Metro / Rail',
  transport: 'Transport Hub',
  it_park: 'IT Park / Tech Office',
  hospital: 'Hospital / Healthcare',
  school: 'School / Education',
  airport: 'Airport',
  highway: 'Highway / Expressway',
  park: 'Park / Lake',
  other: 'Other',
}

interface Usp {
  text: string
  category: string
}

export default function ProjectUspPanel({ usps }: { usps: Usp[] | null | undefined }) {
  if (!usps?.length) {
    return (
      <div className="card p-5 text-center">
        <MapPin className="h-8 w-8 text-theme-tertiary mx-auto mb-2" />
        <p className="text-sm text-theme-secondary">No project USPs added yet.</p>
      </div>
    )
  }

  return (
    <div className="card p-5 space-y-3">
      <h3 className="font-display text-base font-bold text-theme-primary flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" /> Project USPs
      </h3>

      <div className="space-y-2">
        {usps.map((usp, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-lg bg-theme-surface"
          >
            <span className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
              {CATEGORY_LABELS[usp.category] ?? usp.category}
            </span>
            <p className="text-sm text-theme-primary leading-snug">{usp.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
