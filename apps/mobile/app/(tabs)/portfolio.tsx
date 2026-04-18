/**
 * Screen 11: Mobile Portfolio Dashboard.
 * Summary metrics, asset allocation, holdings list.
 */

import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { formatINR } from '@/lib/formatters'
import { usePortfolioSummary, usePortfolioProperties } from '@/hooks/usePortfolio'
import { EmptyState } from '@/components/ui'
import { useOverallProgress } from '@/hooks/useProfiling'
import { useUserStore } from '@/stores/user.store'

export default function PortfolioScreen() {
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary()
  const { data: holdings, isLoading: holdingsLoading } = usePortfolioProperties()
  const user = useUserStore((s) => s.user)
  const { data: overall, isLoading: progressLoading } = useOverallProgress()

  const isInvestor = user?.role === 'investor'
  const hasAnyDna = overall
    ? Object.values(overall.vaults).some((v) => v.isComplete)
    : false

  if (summaryLoading || progressLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#5B4FCF" />
      </View>
    )
  }

  if (isInvestor && !hasAnyDna) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
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
    <ScrollView className="flex-1 bg-surface">
      {/* Summary Cards */}
      <View className="bg-primary px-4 pt-6 pb-8 rounded-b-3xl">
        <Text className="text-white/70 text-sm mb-2">Your Portfolio</Text>

        <View className="flex-row justify-between mb-4">
          <View>
            <Text className="text-white/60 text-xs">Total Invested</Text>
            <Text className="text-white font-bold text-xl">{summary?.totalInvested ? formatINR(summary.totalInvested) : '—'}</Text>
          </View>
          <View className="items-end">
            <Text className="text-white/60 text-xs">Current Value</Text>
            <Text className="text-white font-bold text-xl">{summary?.currentValue ? formatINR(summary.currentValue) : '—'}</Text>
          </View>
        </View>

        <View className="flex-row bg-white/10 rounded-xl p-4 gap-4">
          <View className="flex-1 items-center">
            <Text className="text-white/60 text-[10px]">XIRR</Text>
            <Text className="text-emerald-300 font-bold text-base">{summary?.xirr?.toFixed(1) ?? '—'}%</Text>
          </View>
          <View className="w-px bg-white/20" />
          <View className="flex-1 items-center">
            <Text className="text-white/60 text-[10px]">Monthly Income</Text>
            <Text className="text-white font-bold text-base">{summary?.monthlyIncome ? formatINR(summary.monthlyIncome) : '—'}</Text>
          </View>
          <View className="w-px bg-white/20" />
          <View className="flex-1 items-center">
            <Text className="text-white/60 text-[10px]">Properties</Text>
            <Text className="text-white font-bold text-base">{summary?.propertiesCount ?? 0}</Text>
          </View>
        </View>
      </View>

      {/* Asset Allocation */}
      <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <Text className="text-gray-900 font-bold text-base mb-3">Summary</Text>
        <View className="flex-row justify-between py-2 border-b border-gray-50">
          <Text className="text-gray-500 text-sm">Total Returns</Text>
          <Text className="text-emerald-600 font-bold text-sm">{formatINR(summary?.totalReturns ?? 0)}</Text>
        </View>
        <View className="flex-row justify-between py-2">
          <Text className="text-gray-500 text-sm">Unrealized Gain</Text>
          <Text className="text-emerald-600 font-bold text-sm">{formatINR(summary?.unrealizedGains ?? 0)}</Text>
        </View>
      </View>

      {/* Holdings */}
      <View className="px-4 mt-4 mb-8">
        <Text className="text-gray-900 font-bold text-base mb-3">Your Holdings</Text>
        {holdingsLoading && (
          <View className="items-center py-8">
            <ActivityIndicator size="small" color="#5B4FCF" />
          </View>
        )}
        {(holdings ?? []).length === 0 && !holdingsLoading && (
          <EmptyState
            icon="pie-chart-outline"
            title="No Holdings Yet"
            message="Start investing in properties to build your portfolio"
          />
        )}
        {(holdings ?? []).map((prop) => (
          <Pressable key={prop.propertyId} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-3">
                <Text className="text-gray-900 font-bold text-sm">{prop.propertyTitle}</Text>
                <Text className="text-gray-400 text-xs">{prop.propertyCity} · {prop.units} units</Text>
              </View>
              <View className="items-end">
                <Text className="text-emerald-600 font-bold text-sm">
                  {(prop.currentValue - prop.investedAmount) >= 0 ? '+' : ''}{formatINR(prop.currentValue - prop.investedAmount)}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-50">
              <View>
                <Text className="text-gray-400 text-[10px]">Invested</Text>
                <Text className="text-gray-900 font-bold text-sm">{formatINR(prop.investedAmount)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-400 text-[10px]">Current Value</Text>
                <Text className="text-emerald-600 font-bold text-sm">{formatINR(prop.currentValue)}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
