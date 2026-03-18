/**
 * StatusBadge – color-coded status pill for mobile.
 */

import { View, Text } from 'react-native'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md'
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-700' },
  funding: { bg: 'bg-blue-100', text: 'text-blue-700' },
  funded: { bg: 'bg-purple-100', text: 'text-purple-700' },
  confirmed: { bg: 'bg-green-100', text: 'text-green-700' },
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  payment_pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-700' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
  NOT_STARTED: { bg: 'bg-gray-100', text: 'text-gray-500' },
}

const DEFAULT_COLORS = { bg: 'bg-gray-100', text: 'text-gray-600' }

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const colors = COLOR_MAP[status] ?? DEFAULT_COLORS
  const sizeClass = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs'

  return (
    <View className={`rounded-full ${sizeClass} ${colors.bg}`}>
      <Text className={`${textSize} font-medium capitalize ${colors.text}`}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  )
}
