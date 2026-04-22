/**
 * Select – Modal-based dropdown for React Native.
 * Synced design language with web Select component.
 */

import { useState, useMemo } from 'react'
import {
  View, Text, Pressable, Modal, FlatList, TextInput, SafeAreaView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  searchable?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
  label?: string
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable = false,
  disabled = false,
  size = 'md',
  label,
  className = '',
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  const py = size === 'sm' ? 'py-2' : 'py-3'
  const textSz = size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <View className={className}>
      {label && (
        <Text className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: colors.textTertiary }}>
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        className={`flex-row items-center justify-between ${py} px-3 rounded-xl ${disabled ? 'opacity-50' : ''}`}
        style={{ backgroundColor: isDark ? colors.bgInput : '#FFFFFF', borderWidth: 1, borderColor: isDark ? colors.borderSubtle : '#E5E7EB' }}
      >
        <Text className={`${textSz} flex-1`} style={{ color: selected ? colors.textPrimary : colors.textTertiary }} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textTertiary} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <SafeAreaView className="rounded-t-2xl max-h-[70%]" style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }}>
              <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
                {label || placeholder}
              </Text>
              <Pressable onPress={() => { setOpen(false); setSearch('') }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Search */}
            {searchable && (
              <View className="flex-row items-center gap-2 px-4 py-2" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }}>
                <Ionicons name="search" size={16} color={colors.textTertiary} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search…"
                  placeholderTextColor={colors.textTertiary}
                  className="flex-1 text-sm"
                  style={{ color: colors.textPrimary }}
                  autoFocus
                />
              </View>
            )}

            {/* Options List */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value)
                    setOpen(false)
                    setSearch('')
                  }}
                  className="flex-row items-center justify-between px-4 py-3"
                  style={{ backgroundColor: item.value === value ? (isDark ? 'rgba(212,175,55,0.14)' : 'rgba(91,79,207,0.08)') : 'transparent' }}
                >
                  <Text
                    className="text-sm flex-1"
                    style={{ color: item.value === value ? (isDark ? colors.gold : '#5B4FCF') : colors.textSecondary, fontWeight: item.value === value ? '600' : '400' }}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color={isDark ? colors.gold : '#5B4FCF'} />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Text className="text-sm" style={{ color: colors.textTertiary }}>No results</Text>
                </View>
              }
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  )
}
