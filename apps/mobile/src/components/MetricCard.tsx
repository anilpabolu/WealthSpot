/**
 * Reusable MetricCard for mobile dashboards.
 */

import { View, Text } from 'react-native'

interface MetricCardProps {
  label: string
  value: string
  subtitle?: string
}

export default function MetricCard({ label, value, subtitle }: MetricCardProps) {
  return (
    <View className="bg-white rounded-xl border-2 border-gray-200 p-3 flex-1 min-w-[140px]">
      <Text className="text-xs text-gray-500">{label}</Text>
      <Text className="text-lg font-bold text-gray-900 mt-1">{value}</Text>
      {subtitle && <Text className="text-[10px] text-gray-400 mt-0.5">{subtitle}</Text>}
    </View>
  )
}
