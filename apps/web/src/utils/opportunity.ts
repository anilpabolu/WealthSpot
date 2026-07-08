import { convertKeysToSnake } from '@wealthspot/api-client'
import { formatINRCompact } from '@/lib/formatters'

export function getRawMinInvestment(
  minInvestment: number | null | undefined,
  propertySpecs: Record<string, unknown> | null | undefined
): number[] {
  const prices: number[] = []
  if (minInvestment != null && minInvestment > 0) {
    prices.push(minInvestment)
  }

  if (propertySpecs) {
    const specs = convertKeysToSnake(propertySpecs) as Record<string, unknown>
    const unitConfigs = specs.configurations as { price?: number; investment_amount?: number; price_per_sqft?: number; super_built_up_sqft?: number; carpet_area_sqft?: number }[] | undefined
    const plotConfigs = specs.plot_configurations as { price?: number; investment_amount?: number; price_per_sqft?: number; area_sqft?: number }[] | undefined

    if (unitConfigs?.length) {
      unitConfigs.forEach(u => {
        if (u.price != null && u.price > 0) prices.push(u.price)
        else if (u.investment_amount != null && u.investment_amount > 0) prices.push(u.investment_amount)
        else if (u.price_per_sqft && u.super_built_up_sqft) prices.push(u.price_per_sqft * u.super_built_up_sqft)
        else if (u.price_per_sqft && u.carpet_area_sqft) prices.push(u.price_per_sqft * u.carpet_area_sqft)
      })
    } else if (plotConfigs?.length) {
      plotConfigs.forEach(p => {
        if (p.price != null && p.price > 0) prices.push(p.price)
        else if (p.investment_amount != null && p.investment_amount > 0) prices.push(p.investment_amount)
        else if (p.price_per_sqft && p.area_sqft) prices.push(p.price_per_sqft * p.area_sqft)
      })
    } else if (typeof specs.price_per_sqft === 'number' && typeof specs.total_project_area_sqft === 'number') {
      prices.push(specs.price_per_sqft * specs.total_project_area_sqft)
    }
  }
  return prices
}

export function getOpportunityInvestmentDisplay(
  minInvestment: number | null | undefined,
  propertySpecs: Record<string, unknown> | null | undefined
): string {
  const prices = getRawMinInvestment(minInvestment, propertySpecs)

  if (prices.length > 0) {
    const uniquePrices = Array.from(new Set(prices)).sort((a, b) => a - b)
    const minPrice = uniquePrices[0]
    if (minPrice !== undefined) {
      if (uniquePrices.length > 1) {
        return `Starting from ${formatINRCompact(minPrice)}`
      } else {
        return formatINRCompact(minPrice)
      }
    }
  }
  return '—'
}
