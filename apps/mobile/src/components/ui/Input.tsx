/**
 * Input – Styled TextInput with label, icon, and error state.
 * Synced design language with web Input component.
 */

import { forwardRef, useState } from 'react'
import { View, Text, TextInput, type TextInputProps } from 'react-native'
import type { ReactNode } from 'react'

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
    const py = size === 'sm' ? 'py-2' : 'py-3'
    const textSz = size === 'sm' ? 'text-xs' : 'text-sm'

    const borderColor = error
      ? 'border-red-300'
      : focused
        ? 'border-primary'
        : 'border-gray-200'

    return (
      <View className={className}>
        {label && (
          <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            {label}
          </Text>
        )}
        <View className={`flex-row items-center ${py} px-3 bg-white border rounded-xl ${borderColor}`}>
          {icon && <View className="mr-2">{icon}</View>}
          <TextInput
            ref={ref}
            {...props}
            placeholderTextColor="#D1D5DB"
            onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
            onBlur={(e) => { setFocused(false); props.onBlur?.(e) }}
            className={`flex-1 ${textSz} text-gray-900`}
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
