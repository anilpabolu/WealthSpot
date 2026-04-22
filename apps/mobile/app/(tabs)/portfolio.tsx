/**
 * Screen 11: Mobile Portfolio Dashboard.
 * Summary metrics, asset allocation, holdings list.
 */

import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { formatINR } from '@/lib/formatters'
import { usePortfolioSummary, usePortfolioProperties } from '@/hooks/usePortfolio'
import { EmptyState, FadeInView } from '@/components/ui'
import { useOverallProgress } from '@/hooks/useProfiling'
import { useUserStore } from '@/stores/user.store'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'

export default function PortfolioScreen() {
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary()
  const { data: holdings, isLoading: holdingsLoading } = usePortfolioProperties()
  const user = useUserStore((s) => s.user)
  const { data: overall, isLoading: progressLoading } = useOverallProgress()

  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  const isInvestor = user?.role === 'investor'
  const hasAnyDna = overall
    ? Object.values(overall.vaults).some((v) => v.isComplete)
    : false

  if (summaryLoading || progressLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
        <ActivityIndicator size="large" color={isDark ? colors.gold : '#5B4FCF'} />
      </View>
    )
  }

  if (isInvestor && !hasAnyDna) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
        <EmptyState
          icon="shield-checkmark-outline"
          title="Complete Your DNA Profiling"
          message="Finish at least one vault's DNA profiling to unlock your portfolio"
          actionLabel="Go to Profiling"
          onAction={() => router.push('/profiling')}
        />
      </View>
    )
  }
  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Summary Cards */}
      <FadeInView delay={0}>
      <View className="px-4 pt-6 pb-8 rounded-b-3xl" style={{ backgroundColor: isDark ? '#0c0a1f' : '#5B4FCF' }}>
        <Text className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'PlusJakartaSans' }}>Your Portfolio</Text>

        <View className="flex-row justify-between mb-4">
          <View>
            <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Invested</Text>
            <Text className="font-bold text-xl" style={{ color: '#FFFFFF', fontFamily: 'BricolageGrotesque-Bold' }}>{summary?.totalInvested ? formatINR(summary.totalInvested) : '—'}</Text>
          </View>
          <View className="items-end">
            <Text className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Current Value</Text>
            <Text className="font-bold text-xl" style={{ color: '#FFFFFF', fontFamily: 'BricolageGrotesque-Bold' }}>{summary?.currentValue ? formatINR(summary.currentValue) : '—'}</Text>
          </View>
        </View>

        <View className="flex-row rounded-xl p-4 gap-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <View className="flex-1 items-center">
            <Text className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>XIRR</Text>
            <Text className="font-bold text-base" style={{ color: '#6EE7B7' }}>{summary?.xirr?.toFixed(1) ?? '—'}%</Text>
          </View>
          <View className="w-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View className="flex-1 items-center">
            <Text className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Monthly Income</Text>
            <Text className="font-bold text-base" style={{ color: '#FFFFFF' }}>{summary?.monthlyIncome ? formatINR(summary.monthlyIncome) : '—'}</Text>
          </View>
          <View className="w-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <View className="flex-1 items-center">
            <Text className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Properties</Text>
            <Text className="font-bold text-base" style={{ color: '#FFFFFF' }}>{summary?.propertiesCount ?? 0}</Text>
          </View>
        </View>
      </View>
      </FadeInView>

      {/* Asset Allocation */}
      <FadeInView delay={120}>
      <View
        className="mx-4 mt-4 rounded-3xl p-4"
        style={{
          backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
          borderWidth: isDark ? 1 : 0,
          borderColor: colors.borderSubtle,
          shadowColor: isDark ? '#D4AF37' : '#000',
          shadowOpacity: isDark ? 0.04 : 0.06,
          shadowRadius: isDark ? 10 : 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        }}
      >
        <Text className="font-bold text-base mb-3" style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>Summary</Text>
        <View className="flex-row justify-between py-2" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }}>
          <Text className="text-sm" style={{ color: colors.textSecondary }}>Total Returns</Text>
          <Text className="font-bold text-sm" style={{ color: '#10B981' }}>{formatINR(summary?.totalReturns ?? 0)}</Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-sm" style={{ color: colors.textSecondary }}>Unrealized Gain</Text>
          <Text className="font-bold text-sm" style={{ color: '#10B981' }}>{formatINR(summary?.unrealizedGains ?? 0)}</Text>
        </View>
      </View>
      </FadeInView>

      {/* Holdings */}
      <FadeInView delay={220}>
      <View className="px-4 mt-4 mb-8">
        <Text className="font-bold text-base mb-3" style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>Your Holdings</Text>
        {holdingsLoading && (
          <View className="items-center py-8">
            <ActivityIndicator size="small" color={isDark ? colors.gold : '#5B4FCF'} />
          </View>
        )}
        {(holdings ?? []).length === 0 && !holdingsLoading && (
          <EmptyState
            icon="pie-chart-outline"
            title="No Holdings Yet"
            message="Start investing in properties to build your portfolio"
          />
        )}
        {(holdings ?? []).map((prop, index) => (
          <FadeInView key={prop.propertyId} delay={280 + index * 50}>
          <Pressable
            className="rounded-2xl p-4 mb-3"
            style={{
              backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.borderSubtle,
              shadowColor: isDark ? '#D4AF37' : '#000',
              shadowOpacity: isDark ? 0.04 : 0.06,
              shadowRadius: isDark ? 10 : 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }}
          >
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-3">
                <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>{prop.propertyTitle}</Text>
                <Text className="text-xs" style={{ color: colors.textTertiary }}>{prop.propertyCity} · {prop.units} units</Text>
              </View>
              <View className="items-end">
                <Text className="font-bold text-sm" style={{ color: '#10B981' }}>
                  {(prop.currentValue - prop.investedAmount) >= 0 ? '+' : ''}{formatINR(prop.currentValue - prop.investedAmount)}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }}>
              <View>
                <Text className="text-[10px]" style={{ color: colors.textTertiary }}>Invested</Text>
                <Text className="font-bold text-sm" style={{ color: colors.textPrimary }}>{formatINR(prop.investedAmount)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px]" style={{ color: colors.textTertiary }}>Current Value</Text>
                <Text className="font-bold text-sm" style={{ color: '#10B981' }}>{formatINR(prop.currentValue)}</Text>
              </View>
            </View>
          </Pressable>
          </FadeInView>
        ))}
      </View>
      </FadeInView>
    </ScrollView>
  )
}
