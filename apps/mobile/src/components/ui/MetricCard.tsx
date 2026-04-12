/**
 * MetricCard – Premium metric card with optional trend indicator.
 * Synced design language with web stat-card patterns.
 */

import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  icon?: ReactNode
  className?: string
}

export function MetricCard({
  label,
  value,
  subtitle,
  trend,
  trendLabel,
  icon,
  className = '',
}: MetricCardProps) {
  const trendColor =
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
  const trendIcon =
    trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove-outline'

  return (
    <View className={`bg-white rounded-xl border border-gray-200 p-3.5 flex-1 min-w-[140px] ${className}`}>
      <View className="flex-row items-center justify-between mb-1.5">
        <Text className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider" numberOfLines={1}>
          {label}
        </Text>
        {icon && <View className="ml-1">{icon}</View>}
      </View>
      <Text className="text-lg font-bold text-gray-900" numberOfLines={1}>
        {value}
      </Text>
      <View className="flex-row items-center gap-1 mt-1">
        {trend && (
          <>
            <Ionicons name={trendIcon as any} size={12} className={trendColor} />
            {trendLabel && (
              <Text className={`text-[10px] font-medium ${trendColor}`}>{trendLabel}</Text>
            )}
          </>
        )}
        {!trend && subtitle && (
          <Text className="text-[10px] text-gray-400">{subtitle}</Text>
        )}
      </View>
    </View>
  )
}
