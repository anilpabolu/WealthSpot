import Decimal from 'decimal.js'

/**
 * Format a number in Indian numbering system with ₹ prefix.
 * e.g. 1234567.89 → "₹12,34,567.89"
 */
export function formatINR(value: number | string | Decimal, decimals = 2): string {
  const num = new Decimal(value)
  const fixed = num.toFixed(decimals)
  const [intPart, decPart] = fixed.split('.')

  if (!intPart) return `₹0.${decPart ?? '00'}`

  const isNegative = intPart.startsWith('-')
  const absInt = isNegative ? intPart.slice(1) : intPart

  let formatted: string
  if (absInt.length <= 3) {
    formatted = absInt
  } else {
    const lastThree = absInt.slice(-3)
    const remaining = absInt.slice(0, -3)
    const groups = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
    formatted = `${groups},${lastThree}`
  }

  const prefix = isNegative ? '-₹' : '₹'
  return decPart ? `${prefix}${formatted}.${decPart}` : `${prefix}${formatted}`
}

/**
 * Format large amounts compactly: ₹1.25 Cr, ₹45.2 L, ₹25K
 */
export function formatINRCompact(value: number | string | Decimal): string {
  const num = new Decimal(value).toNumber()
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''

  if (abs >= 1_00_00_000) {
    const cr = abs / 1_00_00_000
    return `${sign}₹${cr.toFixed(cr >= 10 ? 1 : 2)} Cr`
  }
  if (abs >= 1_00_000) {
    const lakh = abs / 1_00_000
    return `${sign}₹${lakh.toFixed(lakh >= 10 ? 1 : 2)} L`
  }
  if (abs >= 1_000) {
    const k = abs / 1_000
    return `${sign}₹${k.toFixed(k >= 10 ? 0 : 1)}K`
  }
  return formatINR(value, 0)
}

/**
 * Format a percentage value: 14.2 → "14.2%"
 */
export function formatPercent(value: number | string | Decimal, decimals = 1): string {
  const num = new Decimal(value)
  return `${num.toFixed(decimals)}%`
}

/**
 * Format date in Indian format: DD MMM YYYY
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const day = d.getDate().toString().padStart(2, '0')
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

/**
 * Format relative time: "2 hours ago", "3 days ago"
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60_000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return formatDate(d)
}

/**
 * Calculate days remaining until a target date
 */
export function daysRemaining(targetDate: Date | string): number {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
