/**
 * Screen 9: Mobile Home / Feed (equivalent of Landing Page).
 * Hero banner, quick stats, featured properties, vault profiling CTA
 * with progress integration, how it works.
 */

import { View, Text, ScrollView, Pressable, Image, RefreshControl, ActivityIndicator } from 'react-native'
import { Link, router } from 'expo-router'
import { useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { formatINR, formatINRCompact } from '@/lib/formatters'
import { useFeaturedProperties } from '@/hooks/useProperties'
import { usePortfolioSummary } from '@/hooks/usePortfolio'
import { useProfilingProgress } from '@/hooks/useProfiling'
import { useQueryClient } from '@tanstack/react-query'

/* ─── Vault config ────────────────────────────────────────────────────── */

const VAULTS = [
  { key: 'wealth', emoji: '🏛️', label: 'Wealth', primary: '#1B2A4A', bg: '#F5F0E1', accent: '#D4AF37' },
  { key: 'opportunity', emoji: '🚀', label: 'Opportunity', primary: '#FF6B6B', bg: '#FFF0F0', accent: '#20E3B2' },
  { key: 'community', emoji: '🤝', label: 'Community', primary: '#D97706', bg: '#FFFBEB', accent: '#065F46' },
] as const

export default function HomeScreen() {
  const qc = useQueryClient()
  const { data: featured, isLoading: featuredLoading } = useFeaturedProperties()
  const { data: portfolio } = usePortfolioSummary()

  // Profiling progress for each vault
  const { data: wealthProgress } = useProfilingProgress('wealth')
  const { data: opportunityProgress } = useProfilingProgress('opportunity')
  const { data: communityProgress } = useProfilingProgress('community')

  const progressMap: Record<string, number | undefined> = {
    wealth: wealthProgress?.completionPct,
    opportunity: opportunityProgress?.completionPct,
    community: communityProgress?.completionPct,
  }

  const anyComplete = wealthProgress?.isComplete || opportunityProgress?.isComplete || communityProgress?.isComplete

  const refreshing = featuredLoading
  const onRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['properties'] })
    qc.invalidateQueries({ queryKey: ['portfolio'] })
    qc.invalidateQueries({ queryKey: ['profiling'] })
  }, [qc])

  const stats = [
    { label: 'Portfolio', value: portfolio ? formatINRCompact(portfolio.currentValue) : '—' },
    { label: 'Properties', value: portfolio ? String(portfolio.propertiesCount) : '—' },
    { label: 'Monthly', value: portfolio ? formatINRCompact(portfolio.monthlyIncome) : '—' },
    { label: 'XIRR', value: portfolio?.xirr ? `${portfolio.xirr.toFixed(1)}%` : '—' },
  ]

  return (
    <ScrollView
      className="flex-1 bg-surface"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B4FCF" />
      }
    >
      {/* Hero Banner */}
      <View
        className="px-5 pt-12 pb-8 rounded-b-3xl"
        style={{ backgroundColor: '#1B2A4A' }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/60 text-xs font-bold uppercase tracking-widest">Welcome to</Text>
            <Text className="text-white text-2xl font-bold tracking-tight">WealthSpot</Text>
          </View>
          <Pressable className="bg-white/15 rounded-2xl p-2.5">
            <Ionicons name="notifications-outline" size={22} color="white" />
          </Pressable>
        </View>

        <Text className="text-white/70 text-sm leading-5 mb-5">
          Invest in premium real estate from ₹10,000. Earn rental income & capital appreciation.
        </Text>

        <Link href="/marketplace" asChild>
          <Pressable
            className="rounded-2xl py-3.5 items-center"
            style={{ backgroundColor: '#D4AF37' }}
          >
            <Text className="font-bold text-base" style={{ color: '#1B2A4A' }}>Explore Properties →</Text>
          </Pressable>
        </Link>
      </View>

      {/* Stats Bar */}
      <View className="flex-row mx-4 mt-[-20] bg-white rounded-2xl p-4 shadow-md">
        {stats.map((stat, i) => (
          <View
            key={stat.label}
            className={`flex-1 items-center ${i < stats.length - 1 ? 'border-r border-gray-100' : ''}`}
          >
            <Text className="font-bold text-base" style={{ color: '#1B2A4A' }}>{stat.value}</Text>
            <Text className="text-gray-400 text-[10px] font-semibold mt-0.5">{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Featured Properties */}
      <View className="px-4 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-900">Featured Properties</Text>
          <Link href="/marketplace" asChild>
            <Pressable>
              <Text className="text-primary text-sm font-semibold">View All</Text>
            </Pressable>
          </Link>
        </View>

        {featuredLoading && (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color="#5B4FCF" />
          </View>
        )}

        {(featured?.properties ?? []).map((property: any) => (
          <Link key={property.id} href={`/property/${property.slug}`} asChild>
            <Pressable className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm">
              {property.coverImage ? (
                <Image
                  source={{ uri: property.coverImage }}
                  className="w-full h-40"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-40 bg-gray-200 items-center justify-center">
                  <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                </View>
              )}
              <View className="absolute top-3 left-3 bg-primary/90 px-2.5 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">{property.assetType}</Text>
              </View>

              <View className="p-4">
                <Text className="text-gray-900 font-bold text-base">{property.title}</Text>
                <Text className="text-gray-500 text-sm mt-0.5">{property.city}</Text>

                <View className="flex-row items-center mt-3 gap-4">
                  <View>
                    <Text className="text-[10px] text-gray-400 uppercase">IRR</Text>
                    <Text className="text-emerald-600 font-bold">{property.targetIrr}%</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] text-gray-400 uppercase">Min Invest</Text>
                    <Text className="text-gray-900 font-bold">{formatINR(property.minInvestment)}</Text>
                  </View>
                </View>

                {/* Funding Bar */}
                <View className="mt-3">
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${property.fundingPercentage}%` }}
                    />
                  </View>
                  <Text className="text-[10px] text-gray-400 mt-1">
                    {property.fundingPercentage}% funded
                  </Text>
                </View>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>

      {/* Vault Profiling CTA */}
      <View className="px-4 mt-6">
        <View className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
          {/* Header */}
          <View className="px-5 pt-5 pb-3">
            <View className="flex-row items-center gap-3 mb-1">
              <Text className="text-2xl">🧬</Text>
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">
                  {anyComplete ? 'Your Investor DNA' : 'Discover Your Investor DNA'}
                </Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  {anyComplete
                    ? 'Complete more vaults for better matches'
                    : 'Answer fun questions to find your perfect match'}
                </Text>
              </View>
            </View>
          </View>

          {/* Vault Cards */}
          <View className="flex-row gap-2 px-4 pb-5">
            {VAULTS.map((v) => {
              const pct = progressMap[v.key]
              const isComplete = pct !== undefined && pct >= 100
              const hasProgress = pct !== undefined && pct > 0 && pct < 100

              return (
                <Pressable
                  key={v.key}
                  onPress={() => router.push(`/profiling?vault=${v.key}`)}
                  className="flex-1 rounded-2xl p-3 items-center border"
                  style={{
                    backgroundColor: v.bg,
                    borderColor: isComplete ? v.accent : '#E5E7EB',
                  }}
                >
                  <Text className="text-2xl mb-1">{v.emoji}</Text>
                  <Text
                    className="text-[10px] font-bold mb-1.5"
                    style={{ color: v.primary }}
                  >
                    {v.label}
                  </Text>

                  {isComplete ? (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="checkmark-circle" size={12} color={v.accent} />
                      <Text className="text-[9px] font-bold" style={{ color: v.accent }}>
                        Done
                      </Text>
                    </View>
                  ) : hasProgress ? (
                    <View className="w-full">
                      <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: v.primary }}
                        />
                      </View>
                      <Text className="text-[8px] text-gray-400 text-center mt-0.5">
                        {Math.round(pct)}%
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="arrow-forward-circle-outline" size={12} color="#9CA3AF" />
                      <Text className="text-[9px] font-semibold text-gray-400">Start</Text>
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>

      {/* How It Works */}
      <View className="px-4 mt-4 mb-8">
        <Text className="text-lg font-bold text-gray-900 mb-3">How It Works</Text>
        {[
          { step: '1', title: 'Browse', desc: 'Explore RERA-verified properties', icon: 'search-outline' as const },
          { step: '2', title: 'Invest', desc: 'Start from just ₹10,000', icon: 'wallet-outline' as const },
          { step: '3', title: 'Earn', desc: 'Get rental income monthly', icon: 'trending-up-outline' as const },
          { step: '4', title: 'Exit', desc: 'Sell on secondary market', icon: 'swap-horizontal-outline' as const },
        ].map((item) => (
          <View key={item.step} className="flex-row items-center bg-white rounded-xl p-4 mb-2">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: '#1B2A4A' }}
            >
              <Ionicons name={item.icon} size={18} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold">{item.title}</Text>
              <Text className="text-gray-500 text-sm">{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
