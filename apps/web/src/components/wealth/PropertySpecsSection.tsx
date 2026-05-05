import { AMENITIES, AMENITY_CATEGORIES } from '@wealthspot/types'
import type { AmenityCategory } from '@wealthspot/types'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

/* ── Helpers ──────────────────────────────────────────────────────── */
function AmenityIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (LucideIcons as unknown as Record<string, React.FC<LucideProps>>)[name]
  if (!Icon) return null
  return <Icon className={className ?? 'h-3.5 w-3.5'} />
}

/* ── Types ────────────────────────────────────────────────────────── */
type UnitCfg = {
  bhk_type: string
  carpet_area_sqft?: number
  super_built_up_sqft?: number
  bathrooms?: number
  balconies?: number
  total_units?: number
  price_per_sqft?: number
}
type PlotCfg = {
  type: string
  area_sqft?: number
  total_plots?: number
  price_per_sqft?: number
}

/* ── Constants ────────────────────────────────────────────────────── */
const PROPERTY_TYPE_META: Record<string, { label: string; icon: string }> = {
  flat: { label: 'Flat / Apartment', icon: '🏢' },
  villa: { label: 'Villa / Row House', icon: '🏡' },
  plot: { label: 'Plot / Land', icon: '🏞️' },
  commercial: { label: 'Commercial', icon: '🏪' },
  warehouse: { label: 'Warehouse', icon: '🏭' },
  mixed_use: { label: 'Mixed Use', icon: '🏙️' },
}

function specsConv(sqft: number) {
  return {
    sqft: sqft.toLocaleString('en-IN'),
    'sq.yd': (sqft / 9).toFixed(1),
    guntha: (sqft / 1089).toFixed(3),
    acre: (sqft / 43560).toFixed(4),
    bigha: (sqft / 27225).toFixed(4),
  }
}

/* ── Component ────────────────────────────────────────────────────── */
export function PropertySpecsSection({
  propertyType,
  pricePerSqft,
  totalProjectAreaSqft,
  specs,
  amenities,
  amenityCostEstimate,
  emptySectionMode = 'hide_empty',
  investmentMode,
}: {
  propertyType: string
  pricePerSqft?: number | null
  totalProjectAreaSqft?: number | null
  specs: Record<string, unknown>
  amenities: string[]
  amenityCostEstimate?: number | null
  emptySectionMode?: string
  investmentMode?: string
}) {
  const showEmpty = emptySectionMode === 'show_placeholder'
  const meta = PROPERTY_TYPE_META[propertyType] ?? { label: propertyType, icon: '🏠' }
  const rawUnitConfigs = (specs.unit_configurations as UnitCfg[] | undefined) ?? []
  // Sort BHK configs ascending by carpet area
  const unitConfigs = [...rawUnitConfigs].sort(
    (a, b) => (a.carpet_area_sqft ?? 0) - (b.carpet_area_sqft ?? 0)
  )
  const plotConfigs = (specs.plot_configurations as PlotCfg[] | undefined) ?? []
  const landParcelSqft = specs.land_parcel_sqft as number | undefined
  const totalTowers = specs.total_towers as number | undefined
  const totalFloors = specs.total_floors as number | undefined
  const possessionDate = specs.possession_date as string | undefined

  const resolvedAmenities = AMENITIES.filter((a) => amenities.includes(a.key))
  const byCategory = Object.fromEntries(
    (Object.keys(AMENITY_CATEGORIES) as AmenityCategory[]).map((cat) => [
      cat,
      resolvedAmenities.filter((a) => a.category === cat),
    ])
  ) as Record<AmenityCategory, typeof resolvedAmenities>

  return (
    <div className="card p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display text-lg font-bold text-theme-primary flex items-center gap-2">
          <span>{meta.icon}</span> Property Specifications
        </h2>
<div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/5 border border-primary/20 text-primary text-xs font-semibold rounded-full">
              {meta.label}
            </span>
            {investmentMode === 'lumpsum' && (
              <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-full">
                🏷️ Lumpsum
              </span>
            )}
            {investmentMode === 'unit_config' && (
              <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full">
                📐 Unit Config
              </span>
            )}
          </div>
      </div>

      {/* Key stats */}
      {(pricePerSqft || totalProjectAreaSqft || possessionDate) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pricePerSqft != null && (
            <div className="p-3 bg-primary/5 rounded-xl text-center">
              <p className="text-[11px] text-theme-secondary font-medium mb-0.5">Price / Sq.Ft</p>
              <p className="font-mono text-lg font-bold text-theme-primary">
                ₹{pricePerSqft.toLocaleString('en-IN')}
              </p>
            </div>
          )}
          {totalProjectAreaSqft != null && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-center">
              <p className="text-[11px] text-theme-secondary font-medium mb-0.5">Project Area</p>
              <p className="font-mono text-lg font-bold text-theme-primary">
                {(totalProjectAreaSqft / 1000).toFixed(1)}K sqft
              </p>
            </div>
          )}
          {possessionDate && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
              <p className="text-[11px] text-theme-secondary font-medium mb-0.5">Possession</p>
              <p className="font-semibold text-sm text-amber-700 dark:text-amber-300">{possessionDate}</p>
            </div>
          )}
        </div>
      )}

      {/* Project overview chips */}
      {(totalTowers != null || totalFloors != null || landParcelSqft != null) && (
        <div className="flex flex-wrap gap-2">
          {totalTowers != null && (
            <span className="px-3 py-1.5 bg-theme-surface border border-theme rounded-lg text-xs font-medium text-theme-primary">
              {totalTowers} Tower{totalTowers > 1 ? 's' : ''}
            </span>
          )}
          {totalFloors != null && (
            <span className="px-3 py-1.5 bg-theme-surface border border-theme rounded-lg text-xs font-medium text-theme-primary">
              {totalFloors} Floor{totalFloors > 1 ? 's' : ''}
            </span>
          )}
          {landParcelSqft != null && (
            <span className="px-3 py-1.5 bg-theme-surface border border-theme rounded-lg text-xs font-medium text-theme-primary">
              {(landParcelSqft / 43560).toFixed(2)} Acres land parcel
            </span>
          )}
        </div>
      )}

      {/* Land area conversion strip */}
      {landParcelSqft != null && landParcelSqft > 0 && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 mb-2 uppercase tracking-wide">
            Land Parcel — Area Conversions
          </p>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(specsConv(landParcelSqft)).map(([unit, val]) => (
              <div key={unit} className="text-center">
                <p className="font-mono text-sm font-bold text-blue-800 dark:text-blue-200">{val}</p>
                <p className="text-[10px] text-blue-500 dark:text-blue-400 uppercase">{unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BHK / Unit configuration table */}
      {(unitConfigs.length > 0 || showEmpty) && propertyType !== 'plot' && (
        <div>
          <h3 className="text-sm font-semibold text-theme-primary mb-3">
            {propertyType === 'warehouse' ? 'Unit / Bay Configurations' : 'BHK / Unit Configurations'}
          </h3>
          {unitConfigs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 bg-theme-surface rounded-xl border border-dashed border-theme">
              <p className="text-sm text-theme-tertiary">Unit configurations not added yet</p>
              <p className="text-xs text-theme-tertiary mt-1">Ask the builder to fill this section</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="bg-theme-surface rounded-t-lg">
                    {['Config', 'Carpet Area', 'Super BUA', 'Baths', 'Balconies', 'Units', '₹/sqft'].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold text-theme-secondary uppercase px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unitConfigs.map((u, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-transparent' : 'bg-theme-surface/50'}>
                      <td className="px-3 py-2.5 font-semibold text-primary">{u.bhk_type}</td>
                      <td className="px-3 py-2.5 text-theme-primary">{u.carpet_area_sqft != null ? `${u.carpet_area_sqft.toLocaleString('en-IN')} sqft` : '—'}</td>
                      <td className="px-3 py-2.5 text-theme-primary">{u.super_built_up_sqft != null ? `${u.super_built_up_sqft.toLocaleString('en-IN')} sqft` : '—'}</td>
                      <td className="px-3 py-2.5 text-theme-primary">{u.bathrooms ?? '—'}</td>
                      <td className="px-3 py-2.5 text-theme-primary">{u.balconies ?? '—'}</td>
                      <td className="px-3 py-2.5 text-theme-primary">{u.total_units ?? '—'}</td>
                      <td className="px-3 py-2.5 text-theme-primary">{u.price_per_sqft != null ? `₹${u.price_per_sqft.toLocaleString('en-IN')}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Computed total from unit configs — unit_config mode */}
          {investmentMode === 'unit_config' && unitConfigs.length > 0 && (() => {
            const total = unitConfigs
              .filter((u) => u.carpet_area_sqft != null && u.total_units != null)
              .reduce((sum, u) => sum + (u.total_units ?? 0) * (u.carpet_area_sqft ?? 0) * (u.price_per_sqft ?? 0), 0)
            if (total === 0) return null
            const crore = total / 1e7
            const lakh = total / 1e5
            const display = crore >= 1 ? `₹${crore.toFixed(2)} Cr` : `₹${lakh.toFixed(2)} L`
            return (
              <div className="mt-3 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Total Project Value</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Σ units × carpet × ₹/sqft across all configurations</p>
                </div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{display}</div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Plot configuration table */}
      {(plotConfigs.length > 0 || showEmpty) && propertyType === 'plot' && (
        <div>
          <h3 className="text-sm font-semibold text-theme-primary mb-3">Plot Configurations</h3>
          {plotConfigs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 bg-theme-surface rounded-xl border border-dashed border-theme">
              <p className="text-sm text-theme-tertiary">Plot configurations not added yet</p>
              <p className="text-xs text-theme-tertiary mt-1">Ask the builder to fill this section</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="bg-theme-surface">
                    {['Type', 'Area (sqft)', 'sq.yd', 'Guntha', 'Plots', '₹/sqft'].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold text-theme-secondary uppercase px-3 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plotConfigs.map((p, i) => {
                    const sqyd = p.area_sqft ? (p.area_sqft / 9).toFixed(1) : '—'
                    const guntha = p.area_sqft ? (p.area_sqft / 1089).toFixed(3) : '—'
                    return (
                      <tr key={i} className={i % 2 === 0 ? 'bg-transparent' : 'bg-theme-surface/50'}>
                        <td className="px-3 py-2.5 font-semibold text-amber-700 dark:text-amber-300">{p.type}</td>
                        <td className="px-3 py-2.5 text-theme-primary">{p.area_sqft != null ? p.area_sqft.toLocaleString('en-IN') : '—'}</td>
                        <td className="px-3 py-2.5 text-theme-primary">{sqyd}</td>
                        <td className="px-3 py-2.5 text-theme-primary">{guntha}</td>
                        <td className="px-3 py-2.5 text-theme-primary">{p.total_plots ?? '—'}</td>
                        <td className="px-3 py-2.5 text-theme-primary">{p.price_per_sqft != null ? `₹${p.price_per_sqft.toLocaleString('en-IN')}` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Computed total from plot configs — unit_config mode */}
          {investmentMode === 'unit_config' && plotConfigs.length > 0 && (() => {
            const total = plotConfigs
              .filter((p) => p.area_sqft != null && p.total_plots != null)
              .reduce((sum, p) => sum + (p.total_plots ?? 0) * (p.area_sqft ?? 0) * (p.price_per_sqft ?? 0), 0)
            if (total === 0) return null
            const crore = total / 1e7
            const lakh = total / 1e5
            const display = crore >= 1 ? `₹${crore.toFixed(2)} Cr` : `₹${lakh.toFixed(2)} L`
            return (
              <div className="mt-3 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Total Project Value</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Σ plots × area × ₹/sqft across all plot types</p>
                </div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{display}</div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Amenities */}
      {(amenities.length > 0 || showEmpty) && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-theme-primary">Amenities{amenities.length > 0 ? ` (${amenities.length})` : ''}</h3>
            {amenityCostEstimate != null && (
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-full">
                Amenity cost est. ₹{amenityCostEstimate.toLocaleString('en-IN')} / unit
              </span>
            )}
          </div>
          {amenities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 bg-theme-surface rounded-xl border border-dashed border-theme">
              <p className="text-sm text-theme-tertiary">Amenities not configured yet</p>
              <p className="text-xs text-theme-tertiary mt-1">Ask the builder to fill this section</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(Object.entries(AMENITY_CATEGORIES) as [AmenityCategory, string][]).map(([catKey, catLabel]) => {
                const catItems = byCategory[catKey] ?? []
                if (catItems.length === 0) return null
                return (
                  <div key={catKey}>
                    <p className="text-[11px] font-semibold text-theme-tertiary uppercase tracking-wider mb-1.5">
                      {catLabel}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {catItems.map((a) => (
                        <span
                          key={a.key}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-theme-surface border border-theme text-theme-secondary"
                        >
                          <AmenityIcon name={a.icon} className="h-3 w-3 shrink-0" />
                          {a.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
