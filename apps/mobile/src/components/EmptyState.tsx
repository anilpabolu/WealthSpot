/**
 * EmptyState – placeholder for empty lists / zero data screens.
 */

import { View, Text } from 'react-native'

interface EmptyStateProps {
  title: string
  message?: string
  icon?: string // emoji
}

export default function EmptyState({ title, message, icon = '📭' }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16 px-8">
      <Text className="text-4xl mb-3">{icon}</Text>
      <Text className="text-base font-bold text-gray-900 text-center">{title}</Text>
      {message && (
        <Text className="text-sm text-gray-500 text-center mt-1">{message}</Text>
      )}
    </View>
  )
}
