/**
 * EmptyState – Consistent empty state with icon + message + optional CTA.
 * Synced design language with web EmptyState component.
 */

import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'

type IonIconName = ComponentProps<typeof Ionicons>['name']

interface EmptyStateProps {
  icon?: IonIconName
  title?: string
  message: string
  actionLabel?: string
  onAction?: () => void
  compact?: boolean
  className?: string
}

export function EmptyState({
  icon = 'mail-open-outline',
  title,
  message,
  actionLabel,
  onAction,
  compact = false,
  className = '',
}: EmptyStateProps) {
  return (
    <View className={`items-center justify-center ${compact ? 'py-6' : 'py-12'} px-8 ${className}`}>
      <View className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-2xl bg-gray-100 items-center justify-center mb-3`}>
        <Ionicons name={icon} size={compact ? 20 : 24} color="#9CA3AF" />
      </View>
      {title && (
        <Text className="text-sm font-semibold text-gray-500 mb-1 text-center">{title}</Text>
      )}
      <Text className={`${compact ? 'text-xs' : 'text-sm'} text-gray-400 text-center max-w-[260px]`}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-4 px-4 py-2 bg-primary rounded-xl"
        >
          <Text className="text-sm font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}
