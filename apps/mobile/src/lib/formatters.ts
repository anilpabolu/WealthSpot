/**
 * formatINR – Indian Rupee formatting.
 */

export function formatINR(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} L`
  }
  return `₹${value.toLocaleString('en-IN')}`
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
