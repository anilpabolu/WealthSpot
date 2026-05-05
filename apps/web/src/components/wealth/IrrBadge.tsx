interface IrrBadgeProps {
  value: number
}

export default function IrrBadge({ value }: IrrBadgeProps) {
  const formatted = `${value.toFixed(1)}%`
  return (
    <span aria-label={`Target IRR ${formatted}`} className="font-semibold text-primary">
      {formatted}
    </span>
  )
}
