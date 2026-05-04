/**
 * Input – Styled TextInput with label, icon, error state, password toggle, and more.
 * Synced design language with web Input component.
 */

import { forwardRef, useState, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, type TextInputProps } from 'react-native'
import type { ReactNode } from 'react'
import { Eye, EyeOff, X, Search, AlertCircle, CheckCircle2 } from 'lucide-react-native'
import { useThemeStore } from '../../stores/theme.store'
import { getThemeColors } from '../../lib/theme'

type InputType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'number'

interface InputProps extends Omit<TextInputProps, 'style'> {
  // Existing props (backward compat)
  label?: string
  error?: string
  icon?: ReactNode
  rightIcon?: ReactNode
  size?: 'sm' | 'md'
  className?: string
  // New props
  type?: InputType
  prefix?: string
  suffix?: string
  clearable?: boolean
  showCounter?: boolean
  helperText?: string
  errorText?: string
  successText?: string
  validate?: (value: string) => string | null
  onValueChange?: (value: string) => void
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label, error, icon, rightIcon,
      size = 'md', className = '',
      type = 'text', prefix, suffix,
      clearable, showCounter, helperText,
      errorText, successText, validate,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false)
    const [touched, setTouched] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [validationError, setValidationError] = useState<string | null>(null)
    const [isValid, setIsValid] = useState(false)

    const resolved = useThemeStore((s) => s.resolved)
    const isDark = resolved === 'dark'
    const colors = getThemeColors(isDark)

    const isPassword = type === 'password'
    const isSearch = type === 'search'

    const effectiveError = errorText ?? error ?? (touched ? validationError : null) ?? null
    const showSuccess = !effectiveError && isValid && touched && successText

    const py = size === 'sm' ? 8 : 12
    const textSz = size === 'sm' ? 12 : 14

    const currentValue = String(props.value ?? '')
    const charCount = currentValue.length
    const maxLen = props.maxLength

    const handleBlur = useCallback((e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setFocused(false)
      setTouched(true)
      if (validate) {
        const result = validate(currentValue)
        setValidationError(result)
        setIsValid(result === null && currentValue.length > 0)
      }
      props.onBlur?.(e)
    }, [validate, currentValue, props.onBlur]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleChangeText = useCallback((text: string) => {
      onValueChange?.(text)
      props.onChangeText?.(text)
      if (touched && validate) {
        const result = validate(text)
        setValidationError(result)
        setIsValid(result === null && text.length > 0)
      }
    }, [touched, validate, onValueChange, props.onChangeText]) // eslint-disable-line react-hooks/exhaustive-deps

    const borderColor = effectiveError
      ? '#FCA5A5'
      : focused
        ? (isDark ? colors.gold : '#5B4FCF')
        : (isDark ? colors.borderSubtle : '#E5E7EB')

    return (
      <View className={className}>
        {label && (
          <Text className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: colors.textSecondary }}>
            {label}
          </Text>
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: py,
            paddingHorizontal: 12,
            borderWidth: 1,
            borderRadius: 12,
            backgroundColor: isDark ? colors.bgInput : '#FFFFFF',
            borderColor,
          }}
        >
          {/* Left: search auto-icon or explicit icon or prefix text */}
          {isSearch && !icon && !prefix && (
            <View style={{ marginRight: 6 }}>
              <Search size={16} color={colors.textSecondary} />
            </View>
          )}
          {icon && !isSearch && (
            <View style={{ marginRight: 6 }}>{icon}</View>
          )}
          {prefix && (
            <Text style={{ color: colors.textSecondary, fontSize: textSz, marginRight: 4 }} selectable={false}>
              {prefix}
            </Text>
          )}

          <TextInput
            ref={ref}
            {...props}
            secureTextEntry={isPassword && !showPassword}
            keyboardType={
              type === 'email' ? 'email-address'
              : type === 'number' ? 'numeric'
              : type === 'tel' ? 'phone-pad'
              : 'default'
            }
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#D1D5DB'}
            onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            style={{ flex: 1, color: colors.textPrimary, fontSize: textSz }}
          />

          {/* Right slot */}
          {isPassword && (
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={{ marginLeft: 6 }}>
              {showPassword
                ? <EyeOff size={16} color={colors.textSecondary} />
                : <Eye size={16} color={colors.textSecondary} />
              }
            </TouchableOpacity>
          )}
          {!isPassword && clearable && currentValue ? (
            <TouchableOpacity onPress={() => { onValueChange?.(''); props.onChangeText?.('') }} style={{ marginLeft: 6 }}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
          {!isPassword && !clearable && effectiveError && (
            <View style={{ marginLeft: 6 }}>
              <AlertCircle size={16} color="#FCA5A5" />
            </View>
          )}
          {!isPassword && !clearable && !effectiveError && showSuccess && (
            <View style={{ marginLeft: 6 }}>
              <CheckCircle2 size={16} color="#4ADE80" />
            </View>
          )}
          {!isPassword && !clearable && !effectiveError && !showSuccess && suffix && (
            <Text style={{ color: colors.textSecondary, fontSize: textSz, marginLeft: 4 }} selectable={false}>
              {suffix}
            </Text>
          )}
          {!isPassword && !clearable && !effectiveError && !showSuccess && !suffix && rightIcon && (
            <View style={{ marginLeft: 6 }}>{rightIcon}</View>
          )}
        </View>

        {/* Bottom row: message + counter */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
          <View style={{ flex: 1 }}>
            {effectiveError ? (
              <Text style={{ fontSize: 11, color: '#EF4444' }}>{effectiveError}</Text>
            ) : showSuccess && successText ? (
              <Text style={{ fontSize: 11, color: '#22C55E' }}>{successText}</Text>
            ) : helperText ? (
              <Text style={{ fontSize: 11, color: colors.textSecondary }}>{helperText}</Text>
            ) : null}
          </View>
          {showCounter && maxLen != null && (
            <Text style={{ fontSize: 11, color: charCount > maxLen ? '#EF4444' : colors.textSecondary }}>
              {charCount}/{maxLen}
            </Text>
          )}
        </View>
      </View>
    )
  }
)

Input.displayName = 'Input'

