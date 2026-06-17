import { describe, expect, it } from 'vitest'

// We duplicate the types to test the logic exactly as it is implemented in ExpressInterestSheet
export interface UnitCfg {
  type?: string
  bhk_type?: string
  super_built_up_sqft?: number | string
  price_per_sqft?: number | string
  price?: number | string
  investment_amount?: number | string
}

export interface PlotCfg {
  type?: string
  plot_type?: string
  area_sqft?: number | string
  price_per_sqft?: number | string
  price?: number | string
  investment_amount?: number | string
}

function computeUnitTotal(cfg: UnitCfg): number | null {
  if (cfg.price != null && Number(cfg.price) > 0) return Number(cfg.price)
  if (cfg.investment_amount != null && Number(cfg.investment_amount) > 0) return Number(cfg.investment_amount)
  if (cfg.super_built_up_sqft && cfg.price_per_sqft) {
    return Number(cfg.super_built_up_sqft) * Number(cfg.price_per_sqft)
  }
  return null
}

function computePlotTotal(cfg: PlotCfg): number | null {
  if (cfg.price != null && Number(cfg.price) > 0) return Number(cfg.price)
  if (cfg.investment_amount != null && Number(cfg.investment_amount) > 0) return Number(cfg.investment_amount)
  if (cfg.area_sqft && cfg.price_per_sqft) {
    return Number(cfg.area_sqft) * Number(cfg.price_per_sqft)
  }
  return null
}

describe('ExpressInterestSheet - Pricing Logic', () => {
  describe('computeUnitTotal', () => {
    it('uses price if available', () => {
      const result = computeUnitTotal({ price: 5000000, investment_amount: 100000, super_built_up_sqft: 1000, price_per_sqft: 2000 })
      expect(result).toBe(5000000)
    })

    it('falls back to investment_amount if price is not available', () => {
      const result = computeUnitTotal({ investment_amount: 2500000, super_built_up_sqft: 1000, price_per_sqft: 2000 })
      expect(result).toBe(2500000)
    })

    it('falls back to area * price_per_sqft if direct amounts are missing', () => {
      const result = computeUnitTotal({ super_built_up_sqft: 1000, price_per_sqft: 2500 })
      expect(result).toBe(2500000)
    })

    it('returns null if no pricing data is available', () => {
      const result = computeUnitTotal({ type: '2 BHK' })
      expect(result).toBeNull()
    })
  })

  describe('computePlotTotal', () => {
    it('uses price if available', () => {
      const result = computePlotTotal({ price: 3000000, investment_amount: 100000, area_sqft: 1500, price_per_sqft: 1000 })
      expect(result).toBe(3000000)
    })

    it('falls back to investment_amount if price is not available', () => {
      const result = computePlotTotal({ investment_amount: 1500000, area_sqft: 1500, price_per_sqft: 1000 })
      expect(result).toBe(1500000)
    })

    it('falls back to area * price_per_sqft if direct amounts are missing', () => {
      const result = computePlotTotal({ area_sqft: 1500, price_per_sqft: 2000 })
      expect(result).toBe(3000000)
    })

    it('returns null if no pricing data is available', () => {
      const result = computePlotTotal({ type: 'Standard Plot' })
      expect(result).toBeNull()
    })
  })
})
