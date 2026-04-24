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
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { useQueryClient } from '@tanstack/react-query'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'
import { MetricCard, Badge, FadeInView } from '@/components/ui'

/* ─── Vault config ────────────────────────────────────────────────────── */

const VAULTS = [
  { key: 'wealth', emoji: '🏛️', label: 'Wealth', primary: '#1B2A4A', bg: '#F5F0E1', accent: '#D4AF37' },
  { key: 'safe', emoji: '🔒', label: 'Safe', primary: '#0F766E', bg: '#F0FDFA', accent: '#5EEAD4' },
  { key: 'community', emoji: '🤝', label: 'Community', primary: '#D97706', bg: '#FFFBEB', accent: '#065F46' },
] as const

export default function HomeScreen() {
  const qc = useQueryClient()
  const { data: featured, isLoading: featuredLoading } = useFeaturedProperties()
  const { data: portfolio } = usePortfolioSummary()
  const { isVaultEnabled } = useVaultConfig()

  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  // Profiling progress for each vault
  const { data: wealthProgress } = useProfilingProgress('wealth')
  const { data: safeProgress } = useProfilingProgress('safe')
  const { data: communityProgress } = useProfilingProgress('community')

  const progressMap: Record<string, number | undefined> = {
    wealth: wealthProgress?.completionPct,
    safe: safeProgress?.completionPct,
    community: communityProgress?.completionPct,
  }

  const anyComplete = wealthProgress?.isComplete || safeProgress?.isComplete || communityProgress?.isComplete

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
      className="flex-1"
      style={{ backgroundColor: colors.bgBase }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? '#D4AF37' : '#5B4FCF'} />
      }
    >
      {/* Hero Banner */}
      <FadeInView delay={0}>
      <View
        className="px-5 pt-12 pb-8 rounded-b-3xl"
        style={{ backgroundColor: isDark ? '#0c0a1f' : '#1B2A4A' }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/60 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'PlusJakartaSans' }}>Welcome to</Text>
            <Text className="text-white text-2xl font-bold tracking-tight" style={{ fontFamily: 'BricolageGrotesque' }}>WealthSpot</Text>
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
      </FadeInView>

      {/* Stats Bar */}
      <FadeInView delay={100}>
      <View className="flex-row gap-2 mx-4 mt-[-20]">
        {stats.map((stat) => (
          <MetricCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            className="shadow-md"
            style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF', borderColor: isDark ? colors.borderSubtle : 'transparent', borderWidth: isDark ? 1 : 0 }}
          />
        ))}
      </View>
      </FadeInView>

      {/* Featured Properties */}
      <FadeInView delay={200}>
      <View className="px-4 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold" style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>Featured Properties</Text>
          <Link href="/marketplace" asChild>
            <Pressable>
              <Text className="text-sm font-semibold" style={{ color: isDark ? colors.gold : '#5B4FCF' }}>View All</Text>
            </Pressable>
          </Link>
        </View>

        {featuredLoading && (
          <View className="items-center py-10">
            <ActivityIndicator size="large" color={isDark ? colors.gold : '#5B4FCF'} />
          </View>
        )}

        {(featured?.properties ?? []).map((property: any) => (
          <Link key={property.id} href={`/property/${property.slug}`} asChild>
            <Pressable
              className="rounded-3xl mb-3 overflow-hidden"
              style={{
                backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
                borderWidth: isDark ? 1 : 0,
                borderColor: colors.cardBorder,
                shadowColor: isDark ? '#D4AF37' : '#000',
                shadowOpacity: isDark ? 0.06 : 0.06,
                shadowRadius: isDark ? 12 : 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 3,
              }}
            >
              {property.coverImage ? (
                <Image
                  source={{ uri: property.coverImage }}
                  className="w-full h-40"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-40 items-center justify-center" style={{ backgroundColor: isDark ? colors.bgCard : '#E5E7EB' }}>
                  <Ionicons name="image-outline" size={32} color={isDark ? colors.textTertiary : '#9CA3AF'} />
                </View>
              )}
              <View className="absolute top-3 left-3">
                <Badge variant="purple" size="xs">{property.assetType}</Badge>
              </View>

              <View className="p-4">
                <Text className="font-bold text-base" style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>{property.title}</Text>
                <Text className="text-sm mt-0.5" style={{ color: colors.textSecondary }}>{property.city}</Text>

                <View className="flex-row items-center mt-3 gap-4">
                  <View>
                    <Text className="text-[10px] uppercase" style={{ color: colors.textTertiary }}>IRR</Text>
                    <Text className="font-bold" style={{ color: '#10B981' }}>{property.targetIrr}%</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] uppercase" style={{ color: colors.textTertiary }}>Min Invest</Text>
                    <Text className="font-bold" style={{ color: colors.textPrimary }}>{formatINR(property.minInvestment)}</Text>
                  </View>
                </View>

                {/* Funding Bar */}
                <View className="mt-3">
                  <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }}>
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${property.fundingPercentage}%`, backgroundColor: isDark ? colors.gold : '#5B4FCF' }}
                    />
                  </View>
                  <Text className="text-[10px] mt-1" style={{ color: colors.textTertiary }}>
                    {property.fundingPercentage}% funded
                  </Text>
                </View>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>
      </FadeInView>

      {/* Vault Profiling CTA */}
      <FadeInView delay={300}>
      <View className="px-4 mt-6">
        <View
          className="rounded-3xl overflow-hidden"
          style={{
            backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
            borderWidth: 1,
            borderColor: isDark ? colors.borderSubtle : '#E5E7EB',
          }}
        >
          {/* Header */}
          <View className="px-5 pt-5 pb-3">
            <View className="flex-row items-center gap-3 mb-1">
              <Text className="text-2xl">🧬</Text>
              <View className="flex-1">
                <Text className="text-base font-bold" style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>
                  {anyComplete ? 'Your Investor DNA' : 'Discover Your Investor DNA'}
                </Text>
                <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
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
              const disabled = !isVaultEnabled(v.key)

              return (
                <Pressable
                  key={v.key}
                  onPress={() => !disabled && router.push(`/profiling?vault=${v.key}`)}
                  className="flex-1 rounded-2xl p-3 items-center border"
                  style={{
                    backgroundColor: disabled
                      ? (isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6')
                      : (isDark ? 'rgba(255,255,255,0.06)' : v.bg),
                    borderColor: disabled
                      ? (isDark ? 'rgba(255,255,255,0.06)' : '#D1D5DB')
                      : isComplete ? v.accent : (isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB'),
                    opacity: disabled ? 0.7 : 1,
                  }}
                >
                  <Text className="text-2xl mb-1">{v.emoji}</Text>
                  <Text
                    className="text-[10px] font-bold mb-1.5"
                    style={{ color: disabled ? (isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF') : (isDark ? '#FFFFFF' : v.primary) }}
                  >
                    {v.label}
                  </Text>

                  {disabled ? (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="lock-closed" size={12} color={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'} />
                      <Text className="text-[9px] font-bold" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF' }}>Soon</Text>
                    </View>
                  ) : isComplete ? (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="checkmark-circle" size={12} color={v.accent} />
                      <Text className="text-[9px] font-bold" style={{ color: v.accent }}>
                        Done
                      </Text>
                    </View>
                  ) : hasProgress ? (
                    <View className="w-full">
                      <View className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }}>
                        <View
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: isDark ? colors.gold : v.primary }}
                        />
                      </View>
                      <Text className="text-[8px] text-center mt-0.5" style={{ color: colors.textTertiary }}>
                        {Math.round(pct)}%
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="arrow-forward-circle-outline" size={12} color={isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF'} />
                      <Text className="text-[9px] font-semibold" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9CA3AF' }}>Start</Text>
                    </View>
                  )}
                </Pressable>
              )
            })}
          </View>
        </View>
      </View>
      </FadeInView>

      {/* How It Works */}
      <FadeInView delay={400}>
      <View className="px-4 mt-4 mb-8">
        <Text className="text-lg font-bold mb-3" style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>How It Works</Text>
        {[
          { step: '1', title: 'Browse', desc: 'Explore RERA-verified properties', icon: 'search-outline' as const },
          { step: '2', title: 'Invest', desc: 'Start from just ₹10,000', icon: 'wallet-outline' as const },
          { step: '3', title: 'Earn', desc: 'Get rental income monthly', icon: 'trending-up-outline' as const },
          { step: '4', title: 'Exit', desc: 'Sell on secondary market', icon: 'swap-horizontal-outline' as const },
        ].map((item) => (
          <View
            key={item.step}
            className="flex-row items-center rounded-2xl p-4 mb-2"
            style={{
              backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.borderSubtle,
            }}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-4"
              style={{ backgroundColor: isDark ? colors.gold : '#1B2A4A' }}
            >
              <Ionicons name={item.icon} size={18} color={isDark ? '#0c0a1f' : 'white'} />
            </View>
            <View className="flex-1">
              <Text className="font-bold" style={{ color: colors.textPrimary }}>{item.title}</Text>
              <Text className="text-sm" style={{ color: colors.textSecondary }}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
      </FadeInView>
    </ScrollView>
  )
}
