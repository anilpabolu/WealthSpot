/**
 * Badge – color-coded status pill with dot, pulse, and icon support.
 * Synced design language with web Badge component.
 */

import { View, Text } from 'react-native'
import type { ReactNode } from 'react'

export type BadgeVariant =
  | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'teal' | 'neutral'
  | 'live' | 'pending' | 'funded' | 'closed' | 'rejected' | 'draft'

const VARIANT_MAP: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success:  { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  warning:  { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200' },
  danger:   { bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-200' },
  info:     { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
  purple:   { bg: 'bg-purple-50',   text: 'text-purple-700',  border: 'border-purple-200' },
  teal:     { bg: 'bg-teal-50',     text: 'text-teal-700',    border: 'border-teal-200' },
  neutral:  { bg: 'bg-gray-100',    text: 'text-gray-600',    border: 'border-gray-200' },
  live:     { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  pending:  { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200' },
  funded:   { bg: 'bg-purple-50',   text: 'text-purple-700',  border: 'border-purple-200' },
  closed:   { bg: 'bg-gray-100',    text: 'text-gray-500',    border: 'border-gray-200' },
  rejected: { bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-200' },
  draft:    { bg: 'bg-gray-100',    text: 'text-gray-500',    border: 'border-gray-200' },
}

interface BadgeProps {
  variant?: BadgeVariant
  children: string
  icon?: ReactNode
  dot?: boolean
  size?: 'xs' | 'sm'
  className?: string
}

export function Badge({
  variant = 'neutral',
  children,
  icon,
  dot = false,
  size = 'xs',
  className = '',
}: BadgeProps) {
  const colors = VARIANT_MAP[variant] ?? VARIANT_MAP.neutral
  const sz = size === 'xs' ? 'px-2 py-0.5' : 'px-2.5 py-1'
  const textSz = size === 'xs' ? 'text-[10px]' : 'text-xs'

  return (
    <View className={`flex-row items-center gap-1.5 rounded-full border ${sz} ${colors.bg} ${colors.border} ${className}`}>
      {dot && (
        <View className="h-1.5 w-1.5 rounded-full bg-current" style={{ opacity: 0.9 }} />
      )}
      {icon}
      <Text className={`${textSz} font-semibold ${colors.text}`}>
        {children}
      </Text>
    </View>
  )
}
