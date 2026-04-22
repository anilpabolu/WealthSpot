/**
 * EmptyState – Consistent empty state with icon + message + optional CTA.
 * Synced design language with web EmptyState component.
 */

import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import { useThemeStore } from '../../stores/theme.store'
import { getThemeColors } from '../../lib/theme'

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
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  return (
    <View className={`items-center justify-center ${compact ? 'py-6' : 'py-12'} px-8 ${className}`}>
      <View
        className={`${compact ? 'h-10 w-10' : 'h-12 w-12'} rounded-2xl items-center justify-center mb-3`}
        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }}
      >
        <Ionicons name={icon} size={compact ? 20 : 24} color={isDark ? colors.textTertiary : '#9CA3AF'} />
      </View>
      {title && (
        <Text className="text-sm font-semibold mb-1 text-center" style={{ color: colors.textSecondary }}>{title}</Text>
      )}
      <Text className={`${compact ? 'text-xs' : 'text-sm'} text-center max-w-[260px]`} style={{ color: colors.textTertiary }}>
        {message}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-4 px-4 py-2 rounded-xl"
          style={{ backgroundColor: isDark ? colors.gold : '#5B4FCF' }}
        >
          <Text className="text-sm font-semibold" style={{ color: isDark ? '#0c0a1f' : '#FFFFFF' }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  )
}
