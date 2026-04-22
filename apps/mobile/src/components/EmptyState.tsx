/**
 * EmptyState – placeholder for empty lists / zero data screens.
 */

import { View, Text } from 'react-native'
import { useThemeStore } from '../stores/theme.store'
import { getThemeColors } from '../lib/theme'

interface EmptyStateProps {
  title: string
  message?: string
  icon?: string // emoji
}

export default function EmptyState({ title, message, icon = '📭' }: EmptyStateProps) {
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <Text className="text-4xl mb-3">{icon}</Text>
      <Text className="text-base font-bold text-center" style={{ color: colors.textPrimary }}>{title}</Text>
      {message && (
        <Text className="text-sm text-center mt-1" style={{ color: colors.textSecondary }}>{message}</Text>
      )}
    </View>
  )
}
