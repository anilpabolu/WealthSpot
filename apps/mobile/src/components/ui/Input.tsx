/**
 * Input – Styled TextInput with label, icon, and error state.
 * Synced design language with web Input component.
 */

import { forwardRef, useState } from 'react'
import { View, Text, TextInput, type TextInputProps } from 'react-native'
import type { ReactNode } from 'react'
import { useThemeStore } from '../../stores/theme.store'
import { getThemeColors } from '../../lib/theme'

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string
  error?: string
  icon?: ReactNode
  rightIcon?: ReactNode
  size?: 'sm' | 'md'
  className?: string
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, icon, rightIcon, size = 'md', className = '', ...props }, ref) => {
    const [focused, setFocused] = useState(false)
    const resolved = useThemeStore((s) => s.resolved)
    const isDark = resolved === 'dark'
    const colors = getThemeColors(isDark)

    const py = size === 'sm' ? 'py-2' : 'py-3'
    const textSz = size === 'sm' ? 'text-xs' : 'text-sm'

    return (
      <View className={className}>
        {label && (
          <Text className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: colors.textSecondary }}>
            {label}
          </Text>
        )}
        <View
          className={`flex-row items-center ${py} px-3 border rounded-xl`}
          style={{
            backgroundColor: isDark ? colors.bgInput : '#FFFFFF',
            borderColor: error
              ? '#FCA5A5'
              : focused
                ? (isDark ? colors.gold : '#5B4FCF')
                : (isDark ? colors.borderSubtle : '#E5E7EB'),
          }}
        >
          {icon && <View className="mr-2">{icon}</View>}
          <TextInput
            ref={ref}
            {...props}
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#D1D5DB'}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
            className={`flex-1 ${textSz}`}
            style={{ color: colors.textPrimary }}
          />
          {rightIcon && <View className="ml-2">{rightIcon}</View>}
        </View>
        {error && (
          <Text className="mt-1 text-xs text-red-500">{error}</Text>
        )}
      </View>
    )
  }
)

Input.displayName = 'Input'
