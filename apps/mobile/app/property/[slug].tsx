/**
 * Screen 14: Mobile Property Detail.
 * Gallery, details, investment CTA, like/share, company info, video.
 */

import { View, Text, ScrollView, Pressable, Image, Dimensions, ActivityIndicator, Modal, Share, Linking } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useState, useCallback, useEffect } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { formatINR } from '@/lib/formatters'
import { Badge } from '@/components/ui'
import { useProperty } from '@/hooks/useProperties'
import { AMENITY_CATEGORIES, resolveAmenities, groupAmenitiesByCategory } from '@wealthspot/types'
import type { AmenityCategory } from '@wealthspot/types'
import { useLikeStatus, useToggleLike, useTrackShare } from '@/hooks/useOpportunityActions'
import { useOpportunityBySlug } from '@/hooks/useOpportunities'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import BuilderUpdatesPanel from '@/components/BuilderUpdatesPanel'
import { ShieldSection } from '@/components/shield/ShieldSection'
import { useProfilingProgress } from '@/hooks/useProfiling'
import { useUserStore } from '@/stores/user.store'
import ExpressInterestSheet from '@/components/eoi/ExpressInterestSheet'
import type { UnitCfg, PlotCfg } from '@/components/eoi/ExpressInterestSheet'

const { width } = Dimensions.get('window')

export default function PropertyDetailScreen() {
  const { slug } = useLocalSearchParams()
  const { data: property, isLoading } = useProperty(slug as string)
  const [activeImage, setActiveImage] = useState(0)
  const [showCompanySheet, setShowCompanySheet] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [showEOISheet, setShowEOISheet] = useState(false)
  const { propertyVideosEnabled, propertyEmptySectionMode } = useVaultConfig()
  const { data: oppData } = useOpportunityBySlug(slug as string)

  // Profiling gate
  const user = useUserStore((s) => s.user)
  const isInvestor = user?.role === 'investor'
  const { data: profilingProgress } = useProfilingProgress(property?.vaultType ?? '')
  const dnaComplete = profilingProgress?.isComplete ?? false
  const [showProfilingGate, setShowProfilingGate] = useState(false)

  useEffect(() => {
    if (property && isInvestor && !dnaComplete) setShowProfilingGate(true)
  }, [property, isInvestor, dnaComplete])

  // Like / Share
  const { data: likeData } = useLikeStatus(property?.id ?? '')
  const toggleLike = useToggleLike()
  const trackShare = useTrackShare()

  const handleLike = useCallback(() => {
    if (!property) return
    toggleLike.mutate(property.id)
  }, [property, toggleLike])

  const handleShare = useCallback(async () => {
    if (!property) return
    trackShare.mutate(property.id)
    try {
      await Share.share({
        message: `Check out ${property.title} on WealthSpot!\nhttps://wealthspot.in/property/${property.slug}`,
      })
    } catch { /* user cancelled */ }
  }, [property, trackShare])

  if (isLoading || !property) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#5B4FCF" />
      </View>
    )
  }

  const fundingPct = property.fundingPercentage ?? ((property.raised / property.target) * 100)
  const gallery = property.gallery.length > 0
    ? property.gallery
    : property.coverImage ? [property.coverImage] : []
  // Effective spec data: prefer property-level fields, fall back to linked opportunity
  const effectivePropertyType = property.propertyType ?? oppData?.propertyType
  const effectivePropertySpecs = (property.propertySpecs ?? oppData?.propertySpecs) as Record<string, unknown> | undefined
  const effectivePropertyAmenities =
    (property.propertyAmenities && property.propertyAmenities.length > 0)
      ? property.propertyAmenities
      : (oppData?.propertyAmenities && oppData.propertyAmenities.length > 0)
        ? oppData.propertyAmenities
        : property.amenities
  const effectiveSafeVaultData = (oppData?.safeVaultData ?? null) as Record<string, unknown> | null

  // Extract unit / plot configs from property specs for EOI sheet
  const eoiUnitConfigs = (effectivePropertySpecs?.unit_configs ?? []) as UnitCfg[]
  const eoiPlotConfigs = (effectivePropertySpecs?.plot_configs ?? []) as PlotCfg[]
  const eoiOpportunityId = oppData?.id ?? property.id

  return (
    <View className="flex-1 bg-surface">
      <ScrollView className="flex-1">
        {/* Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e: { nativeEvent: { contentOffset: { x: number } } }) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / width)
            setActiveImage(page)
          }}
          scrollEventThrottle={16}
        >
          {gallery.map((img, i) => (
            <Image
              key={i}
              source={{ uri: img }}
              style={{ width, height: 280 }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Image Dots */}
        <View className="flex-row justify-center mt-2 gap-1.5">
          {gallery.map((_, i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full ${i === activeImage ? 'bg-primary' : 'bg-gray-300'}`}
            />
          ))}
        </View>

        {/* Watch Video button */}
        {propertyVideosEnabled && property.videoUrl ? (
          <View className="px-4 mt-2">
            <Pressable
              onPress={() => setShowVideoModal(true)}
              className="bg-black/80 self-start px-4 py-2 rounded-lg flex-row items-center gap-2"
            >
              <Ionicons name="play-circle" size={18} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold">Watch Video</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="px-4 mt-4">
          {/* Title */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-2 mb-1">
                <Badge variant="purple" size="xs">{property.assetType}</Badge>
                {property.reraNumber ? (
                  <Badge variant="success" size="xs">RERA</Badge>
                ) : null}
              </View>
              <Text className="text-gray-900 font-bold text-xl">{property.title}</Text>
              <Text className="text-gray-500 text-sm">{property.micromarket}, {property.city}</Text>
            </View>
            {/* Like & Share */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleLike}
                className={`w-10 h-10 rounded-xl items-center justify-center border ${likeData?.liked ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}
              >
                <Ionicons
                  name={likeData?.liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={likeData?.liked ? '#EF4444' : '#9CA3AF'}
                />
              </Pressable>
              <Pressable
                onPress={handleShare}
                className="w-10 h-10 rounded-xl items-center justify-center border border-gray-200 bg-white"
              >
                <Ionicons name="share-social-outline" size={20} color="#9CA3AF" />
              </Pressable>
            </View>
          </View>

          {/* Key Metrics */}
          <View className="flex-row bg-white rounded-2xl p-4 mt-4 shadow-sm">
            <View className="flex-1 items-center border-r border-gray-100">
              <Text className="text-[10px] text-gray-400 uppercase">Min Invest</Text>
              <Text className="text-gray-900 font-bold text-lg">{formatINR(property.minInvestment)}</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[10px] text-gray-400 uppercase">Rental Yield</Text>
              <Text className="text-blue-600 font-bold text-lg">{property.rentalYield}%</Text>
            </View>
          </View>

          {/* Funding Progress */}
          <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-sm">Funding Progress</Text>
              <Text className="text-primary font-bold">{fundingPct.toFixed(0)}%</Text>
            </View>
            <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: `${Math.min(fundingPct, 100)}%` }} />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-400 text-xs">{formatINR(property.raised)} raised</Text>
              <Text className="text-gray-400 text-xs">of {formatINR(property.target)}</Text>
            </View>
            <View className="flex-row items-center mt-2">
              <Ionicons name="people-outline" size={14} color="#9CA3AF" />
              <Text className="text-gray-500 text-xs ml-1">{property.investorCount} investors</Text>
            </View>
          </View>

          {/* Description */}
          <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
            <Text className="text-gray-900 font-bold text-base mb-2">About This Property</Text>
            <Text className="text-gray-600 text-sm leading-5">{property.description}</Text>
          </View>

          {/* ── Property Details (type-discriminated) ── */}
          {(() => {
            const specs = effectivePropertySpecs
            const pType = effectivePropertyType
            const landSqft = specs?.land_parcel_sqft != null ? Number(specs.land_parcel_sqft) : null
            const towers = specs?.total_towers != null ? Number(specs.total_towers) : null
            const floors = specs?.total_floors != null ? Number(specs.total_floors) : null
            const reraNum = (specs?.rera_registration_number ?? specs?.rera_number) as string | undefined
            const possession = (specs?.possession_date as string | undefined) ?? property.possessionDate
            const showEmpty = propertyEmptySectionMode === 'show_placeholder'

            const unitConfs = (specs?.unit_configurations as Record<string, unknown>[] | undefined) ?? []
            const plotConfs = (specs?.plot_configurations as Record<string, unknown>[] | undefined) ?? []
            const totalFlats = unitConfs.reduce((sum, u) => sum + (Number(u.total_units) || 0), 0)
            const totalPlots = plotConfs.reduce((sum, p) => sum + (Number(p.total_plots) || 0), 0)

            const rows: { label: string; value: string; empty?: boolean }[] = []

            const addRow = (label: string, rawValue: string | number | null | undefined) => {
              if (rawValue != null && rawValue !== '' && rawValue !== 0) {
                rows.push({ label, value: String(rawValue) })
              } else if (showEmpty) {
                rows.push({ label, value: '—', empty: true })
              }
            }

            if (pType === 'flat' || pType === 'commercial' || pType === 'mixed_use') {
              addRow('Total Land Area', landSqft != null ? `${landSqft.toLocaleString('en-IN')} sq.ft` : null)
              addRow('No. of Towers', towers)
              addRow('Floors per Tower', floors)
              addRow(pType === 'flat' ? 'Total Flats' : 'Total Units', totalFlats > 0 ? totalFlats : null)
            } else if (pType === 'villa') {
              addRow('Total Land Area', landSqft != null ? `${landSqft.toLocaleString('en-IN')} sq.ft` : null)
              addRow('No. of Floors', floors)
              addRow('Total Villas', totalFlats > 0 ? totalFlats : null)
            } else if (pType === 'plot') {
              addRow('Total Land Area', landSqft != null ? `${landSqft.toLocaleString('en-IN')} sq.ft` : null)
              addRow('Total Plots', totalPlots > 0 ? totalPlots : null)
            } else if (pType === 'warehouse') {
              addRow('Total Land Area', landSqft != null ? `${landSqft.toLocaleString('en-IN')} sq.ft` : null)
              addRow('No. of Floors', floors)
              addRow('Total Units', totalFlats > 0 ? totalFlats : null)
            } else {
              if (property.areaSqft) rows.push({ label: 'Area', value: `${property.areaSqft} sq.ft` })
            }

            if (possession) rows.push({ label: 'Possession', value: possession })
            if (reraNum) rows.push({ label: 'RERA', value: reraNum })
            rows.push({ label: 'Available Units', value: `${property.totalUnits - property.soldUnits}` })
            rows.push({ label: 'Unit Price', value: formatINR(property.unitPrice) })
            rows.push({ label: 'Builder', value: property.builderName || '—' })

            return (
              <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
                <Text className="text-gray-900 font-bold text-base mb-3">Property Details</Text>
                {rows.map((row) => (
                  <View key={row.label} className="flex-row justify-between py-2 border-b border-gray-50">
                    <Text className="text-gray-500 text-sm">{row.label}</Text>
                    <Text className={`font-semibold text-sm ${row.empty ? 'text-gray-300' : 'text-gray-900'}`}>{row.value}</Text>
                  </View>
                ))}
              </View>
            )
          })()}

          {/* ── Unit Configurations Table ── */}
          {effectivePropertyType && effectivePropertyType !== 'plot' && (() => {
            const rawUnits = (effectivePropertySpecs?.unit_configurations as Record<string, unknown>[] | undefined) ?? []
            const hasData = rawUnits.length > 0
            if (!hasData && propertyEmptySectionMode === 'hide_empty') return null
            return (
              <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
                <Text className="text-gray-900 font-bold text-base mb-3">Unit Configurations</Text>
                {!hasData ? (
                  <View className="py-4 items-center">
                    <Ionicons name="grid-outline" size={24} color="#D1D5DB" />
                    <Text className="text-gray-400 text-xs mt-2 text-center">Unit configurations not added yet</Text>
                    <Text className="text-gray-300 text-[10px] mt-0.5 text-center">Ask the builder to fill this section</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator>
                    <View>
                      <View className="flex-row bg-gray-50 rounded-t-xl px-1 py-2">
                        {[['Config', 80], ['Carpet', 70], ['Super BUA', 80], ['Baths', 56], ['Balconies', 68], ['Units', 56], ['₹/sqft', 72]] .map(([h, w]) => (
                          <Text key={h} className="text-[10px] font-semibold text-gray-500 uppercase text-center" style={{ width: w as number }}>{h as string}</Text>
                        ))}
                      </View>
                      {rawUnits.map((u, i) => (
                        <View key={i} className={`flex-row px-1 py-2.5 ${i < rawUnits.length - 1 ? 'border-b border-gray-50' : ''}`}>
                          <Text className="text-primary font-bold text-xs text-center" style={{ width: 80 }}>{String(u.bhk_type ?? '—')}</Text>
                          <Text className="text-gray-700 text-xs text-center" style={{ width: 70 }}>{u.carpet_area_sqft ? `${u.carpet_area_sqft}` : '—'}</Text>
                          <Text className="text-gray-700 text-xs text-center" style={{ width: 80 }}>{u.super_built_up_sqft ? `${u.super_built_up_sqft}` : '—'}</Text>
                          <Text className="text-gray-700 text-xs text-center" style={{ width: 56 }}>{u.bathrooms != null ? String(u.bathrooms) : '—'}</Text>
                          <Text className="text-gray-700 text-xs text-center" style={{ width: 68 }}>{u.balconies != null ? String(u.balconies) : '—'}</Text>
                          <Text className="text-gray-700 text-xs text-center" style={{ width: 56 }}>{u.total_units != null ? String(u.total_units) : '—'}</Text>
                          <Text className="text-gray-700 text-xs text-center" style={{ width: 72 }}>{u.price_per_sqft ? `₹${Number(u.price_per_sqft).toLocaleString('en-IN')}` : '—'}</Text>
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
            )
          })()}

          {/* ── Plot Configurations Table ── */}
          {effectivePropertyType === 'plot' && (() => {
            const rawPlots = (effectivePropertySpecs?.plot_configurations as Record<string, unknown>[] | undefined) ?? []
            const hasData = rawPlots.length > 0
            if (!hasData && propertyEmptySectionMode === 'hide_empty') return null
            return (
              <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
                <Text className="text-gray-900 font-bold text-base mb-3">Plot Configurations</Text>
                {!hasData ? (
                  <View className="py-4 items-center">
                    <Ionicons name="map-outline" size={24} color="#D1D5DB" />
                    <Text className="text-gray-400 text-xs mt-2 text-center">Plot configurations not added yet</Text>
                    <Text className="text-gray-300 text-[10px] mt-0.5 text-center">Ask the builder to fill this section</Text>
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator>
                    <View>
                      <View className="flex-row bg-gray-50 rounded-t-xl px-1 py-2">
                        {[['Type', 80], ['Area (sqft)', 80], ['sq.yd', 68], ['Guntha', 68], ['Plots', 56], ['₹/sqft', 72]].map(([h, w]) => (
                          <Text key={h} className="text-[10px] font-semibold text-gray-500 uppercase text-center" style={{ width: w as number }}>{h as string}</Text>
                        ))}
                      </View>
                      {rawPlots.map((p, i) => {
                        const area = Number(p.area_sqft ?? 0)
                        const sqyd = area > 0 ? (area / 9).toFixed(0) : '—'
                        const guntha = area > 0 ? (area / 1089).toFixed(2) : '—'
                        return (
                          <View key={i} className={`flex-row px-1 py-2.5 ${i < rawPlots.length - 1 ? 'border-b border-gray-50' : ''}`}>
                            <Text className="text-amber-700 font-bold text-xs text-center" style={{ width: 80 }}>{String(p.type ?? p.plot_type ?? '—')}</Text>
                            <Text className="text-gray-700 text-xs text-center" style={{ width: 80 }}>{area > 0 ? area.toLocaleString('en-IN') : '—'}</Text>
                            <Text className="text-gray-700 text-xs text-center" style={{ width: 68 }}>{sqyd}</Text>
                            <Text className="text-gray-700 text-xs text-center" style={{ width: 68 }}>{guntha}</Text>
                            <Text className="text-gray-700 text-xs text-center" style={{ width: 56 }}>{p.total_plots != null ? String(p.total_plots) : '—'}</Text>
                            <Text className="text-gray-700 text-xs text-center" style={{ width: 72 }}>{p.price_per_sqft ? `₹${Number(p.price_per_sqft).toLocaleString('en-IN')}` : '—'}</Text>
                          </View>
                        )
                      })}
                    </View>
                  </ScrollView>
                )}
              </View>
            )
          })()}

          {/* ── Amenities ── */}
          {(() => {
            const hasAmenities = effectivePropertyAmenities.length > 0
            const showPlaceholder = propertyEmptySectionMode === 'show_placeholder'
            if (!effectivePropertyType && !hasAmenities) return null
            if (!hasAmenities && !showPlaceholder) return null
            if (!hasAmenities) {
              return (
                <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
                  <Text className="text-gray-900 font-bold text-base mb-3">Amenities</Text>
                  <View className="py-4 items-center">
                    <Ionicons name="sparkles-outline" size={24} color="#D1D5DB" />
                    <Text className="text-gray-400 text-xs mt-2 text-center">Amenities not configured yet</Text>
                    <Text className="text-gray-300 text-[10px] mt-0.5 text-center">Ask the builder to fill this section</Text>
                  </View>
                </View>
              )
            }
            const grouped = groupAmenitiesByCategory(resolveAmenities(effectivePropertyAmenities))
            const categories = Object.keys(AMENITY_CATEGORIES) as AmenityCategory[]
            const usedCats = categories.filter((c) => (grouped[c]?.length ?? 0) > 0)
            if (usedCats.length === 0) {
              // Legacy plain-text amenities fallback
              return (
                <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
                  <Text className="text-gray-900 font-bold text-base mb-3">Amenities</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {effectivePropertyAmenities.map((a) => (
                      <View key={a} className="bg-gray-50 px-3 py-1.5 rounded-full">
                        <Text className="text-gray-600 text-xs">{a}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )
            }
            return (
              <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
                <Text className="text-gray-900 font-bold text-base mb-3">Amenities</Text>
                {usedCats.map((cat) => (
                  <View key={cat} className="mb-3">
                    <Text className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{AMENITY_CATEGORIES[cat]}</Text>
                    <View className="flex-row flex-wrap gap-1.5">
                      {(grouped[cat] ?? []).map((a) => (
                        <View key={a.key} className="bg-primary/5 border border-primary/15 px-3 py-1 rounded-full">
                          <Text className="text-primary text-xs font-medium">{a.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )
          })()}

          {/* ── Safe Vault Terms ── */}
          {property.vaultType === 'safe' && effectiveSafeVaultData && (() => {
            const svd = effectiveSafeVaultData
            const terms: { label: string; value: string }[] = []
            if (svd.interest_rate != null) terms.push({ label: 'Interest Rate', value: `${svd.interest_rate}% p.a.` })
            if (svd.payout_frequency) terms.push({ label: 'Payout', value: String(svd.payout_frequency) })
            if (svd.tenure_months != null) terms.push({ label: 'Tenure', value: `${svd.tenure_months} months` })
            if (svd.capital_protection) terms.push({ label: 'Capital Protection', value: '✓ Included' })
            const buyback = svd.buyback_guarantee as Record<string, unknown> | undefined
            if (buyback?.enabled) terms.push({ label: 'Buyback Guarantee', value: String(buyback.details ?? '✓ Available') })
            const mortgage = svd.mortgage_agreement as Record<string, unknown> | undefined
            if (mortgage?.enabled) terms.push({ label: 'Mortgage Agreement', value: String(mortgage.period_description ?? '✓ Included') })
            const landReg = svd.land_registration as Record<string, unknown> | undefined
            if (landReg?.enabled) terms.push({ label: 'Land Registration', value: String(landReg.details ?? '✓ Included') })
            const rera = svd.rera_registration as Record<string, unknown> | undefined
            if (rera?.enabled && rera.rera_number) terms.push({ label: 'RERA', value: String(rera.rera_number) })
            if (terms.length === 0) return null
            return (
              <View className="bg-emerald-50 rounded-2xl p-4 mt-3 border border-emerald-200">
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons name="shield-checkmark" size={18} color="#059669" />
                  <Text className="text-emerald-800 font-bold text-base">Safe Vault Terms</Text>
                </View>
                {terms.map((t) => (
                  <View key={t.label} className="flex-row justify-between py-2 border-b border-emerald-100">
                    <Text className="text-emerald-700 text-sm">{t.label}</Text>
                    <Text className="text-emerald-900 font-semibold text-sm">{t.value}</Text>
                  </View>
                ))}
              </View>
            )
          })()}

          {/* WealthSpot Shield */}
          <View className="mt-3">
            <ShieldSection opportunityId={property.id} />
          </View>

          {/* Builder / Company Card */}
          {property.builder ? (
            <Pressable
              onPress={() => setShowCompanySheet(true)}
              className="bg-white rounded-2xl p-4 mt-3 shadow-sm"
            >
              <Text className="text-gray-900 font-bold text-base mb-3">Developer / Company</Text>
              <View className="flex-row items-center">
                {property.builderLogo ? (
                  <Image
                    source={{ uri: property.builderLogo }}
                    className="w-12 h-12 rounded-xl"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center">
                    <Ionicons name="business-outline" size={24} color="#9CA3AF" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-gray-900 font-semibold text-sm">{property.builderName}</Text>
                    {property.builder.verified && (
                      <Ionicons name="checkmark-circle" size={14} color="#5B4FCF" />
                    )}
                  </View>
                  {property.builder.reraNumber ? (
                    <Text className="text-gray-400 text-xs mt-0.5">RERA: {property.builder.reraNumber}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </View>
            </Pressable>
          ) : null}

          {/* Builder Updates */}
          <BuilderUpdatesPanel opportunityId={property.id} />

          <View className="mb-24" />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3">
        <View className="flex-row items-center mb-2">
          <Text className="text-gray-400 text-[10px]">Starting from</Text>
          <Text className="text-gray-900 font-bold text-base ml-auto">{formatINR(property.minInvestment)}</Text>
        </View>
        <View className="flex-row gap-3">
          {eoiOpportunityId && (
            <Pressable
              onPress={() => setShowEOISheet(true)}
              className="flex-1 bg-primary py-3.5 rounded-xl items-center justify-center"
            >
              <Text className="text-white font-bold text-sm">EXPRESS INTEREST</Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push(`/invest/${property.id}?oppId=${eoiOpportunityId}`)}
            className={`py-3.5 rounded-xl items-center justify-center border border-primary ${
              eoiOpportunityId ? 'flex-1' : 'flex-1 bg-primary'
            }`}
          >
            <Text className={`font-bold text-sm ${eoiOpportunityId ? 'text-primary' : 'text-white'}`}>
              INVEST NOW
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Express Interest Sheet */}
      {eoiOpportunityId && (
        <ExpressInterestSheet
          visible={showEOISheet}
          onClose={() => setShowEOISheet(false)}
          opportunityId={eoiOpportunityId}
          opportunityTitle={property.title}
          minInvestment={property.minInvestment}
          investmentMode={oppData?.investment_mode}
          unitConfigs={eoiUnitConfigs}
          plotConfigs={eoiPlotConfigs}
        />
      )}

      {/* Video Player Modal */}
      {propertyVideosEnabled && (
      <Modal
        visible={showVideoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View className="flex-1 bg-black/90 items-center justify-center">
          <Pressable
            onPress={() => setShowVideoModal(false)}
            className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <View className="w-full px-4">
            <Pressable
              onPress={() => {
                if (property?.videoUrl) Linking.openURL(property.videoUrl)
              }}
              className="bg-white/10 rounded-2xl p-8 items-center"
            >
              <Ionicons name="play-circle" size={64} color="#FFFFFF" />
              <Text className="text-white font-semibold text-base mt-4">Tap to play video</Text>
              <Text className="text-white/60 text-xs mt-1">Opens in external player</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      )}

      {/* Company Info Bottom Sheet */}
      <Modal
        visible={showCompanySheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCompanySheet(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable className="flex-1" onPress={() => setShowCompanySheet(false)} />
          <View className="bg-white rounded-t-3xl max-h-[80%]">
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>
            <ScrollView className="px-5 pb-8" bounces={false}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 font-bold text-lg">Developer / Company</Text>
                <Pressable onPress={() => setShowCompanySheet(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </Pressable>
              </View>

              {/* Identity */}
              <View className="flex-row items-center gap-3 mb-5">
                {property.builderLogo ? (
                  <Image
                    source={{ uri: property.builderLogo }}
                    className="w-16 h-16 rounded-xl"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-xl bg-gray-100 items-center justify-center">
                    <Ionicons name="business-outline" size={32} color="#9CA3AF" />
                  </View>
                )}
                <View className="flex-1">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-gray-900 font-bold text-xl">{property.builderName}</Text>
                    {property.builder?.verified && (
                      <Ionicons name="checkmark-circle" size={18} color="#5B4FCF" />
                    )}
                  </View>
                </View>
              </View>

              {/* Stats Row */}
              <View className="flex-row gap-3 mb-5">
                {property.builder?.experienceYears != null && (
                  <View className="flex-1 bg-primary/5 rounded-xl p-3 items-center">
                    <Ionicons name="calendar-outline" size={20} color="#5B4FCF" />
                    <Text className="text-gray-900 font-bold text-lg mt-1">{property.builder.experienceYears}+</Text>
                    <Text className="text-gray-500 text-[10px] font-medium">Years</Text>
                  </View>
                )}
                {property.builder?.projectsCompleted != null && property.builder.projectsCompleted > 0 && (
                  <View className="flex-1 bg-primary/5 rounded-xl p-3 items-center">
                    <Ionicons name="business-outline" size={20} color="#5B4FCF" />
                    <Text className="text-gray-900 font-bold text-lg mt-1">{property.builder.projectsCompleted}</Text>
                    <Text className="text-gray-500 text-[10px] font-medium">Projects</Text>
                  </View>
                )}
              </View>

              {/* About */}
              {(property.builder?.about || property.builder?.description) ? (
                <View className="mb-5">
                  <Text className="text-gray-600 text-xs font-semibold uppercase mb-2">About</Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    {property.builder.about || property.builder.description}
                  </Text>
                </View>
              ) : null}

              {/* Details */}
              <View className="gap-3 mb-6">
                {property.builder?.reraNumber ? (
                  <View className="flex-row items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
                    <View>
                      <Text className="text-gray-400 text-[10px]">RERA Registration</Text>
                      <Text className="text-gray-900 font-semibold text-sm">{property.builder.reraNumber}</Text>
                    </View>
                  </View>
                ) : null}
                {property.builder?.city ? (
                  <View className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Ionicons name="location-outline" size={20} color="#9CA3AF" />
                    <View>
                      <Text className="text-gray-400 text-[10px]">Headquartered In</Text>
                      <Text className="text-gray-900 font-semibold text-sm">{property.builder.city}</Text>
                    </View>
                  </View>
                ) : null}
                {property.builder?.website ? (
                  <Pressable
                    onPress={() => Linking.openURL(property.builder!.website!)}
                    className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <Ionicons name="globe-outline" size={20} color="#9CA3AF" />
                    <View>
                      <Text className="text-gray-400 text-[10px]">Website</Text>
                      <Text className="text-primary font-semibold text-sm">
                        {property.builder.website.replace(/^https?:\/\//, '')}
                      </Text>
                    </View>
                  </Pressable>
                ) : null}
              </View>

              {/* Close */}
              <Pressable
                onPress={() => setShowCompanySheet(false)}
                className="bg-gray-100 py-3 rounded-xl items-center mb-4"
              >
                <Text className="text-gray-700 font-semibold">Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Profiling Gate Modal */}
      <Modal
        visible={showProfilingGate}
        animationType="fade"
        transparent
        onRequestClose={() => setShowProfilingGate(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm items-center">
            <View className="w-14 h-14 rounded-2xl bg-primary/10 items-center justify-center mb-4">
              <Ionicons name="shield-checkmark-outline" size={28} color="#5B4FCF" />
            </View>
            <Text className="text-gray-900 font-bold text-lg text-center mb-2">
              Complete Your DNA Profile
            </Text>
            <Text className="text-gray-500 text-sm text-center mb-6">
              Answer a few questions about your investment preferences to unlock this opportunity.
            </Text>
            <Pressable
              onPress={() => {
                setShowProfilingGate(false)
                router.push('/profiling')
              }}
              className="bg-primary w-full py-3.5 rounded-xl items-center mb-3"
            >
              <Text className="text-white font-bold text-sm">Start Profiling</Text>
            </Pressable>
            <Pressable onPress={() => setShowProfilingGate(false)}>
              <Text className="text-gray-400 text-sm">Maybe Later</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}
