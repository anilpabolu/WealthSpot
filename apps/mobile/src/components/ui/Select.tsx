/**
 * Select – Modal-based dropdown for React Native.
 * Synced design language with web Select component.
 */

import { useState, useMemo } from 'react'
import {
  View, Text, Pressable, Modal, FlatList, TextInput, SafeAreaView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

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
        <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      )}
      <Pressable
        onPress={() => !disabled && setOpen(true)}
        className={`flex-row items-center justify-between ${py} px-3 bg-white border border-gray-200 rounded-xl ${disabled ? 'opacity-50' : ''}`}
      >
        <Text className={`${textSz} ${selected ? 'text-gray-900' : 'text-gray-400'} flex-1`} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <SafeAreaView className="bg-white rounded-t-2xl max-h-[70%]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
              <Text className="text-base font-bold text-gray-900">
                {label || placeholder}
              </Text>
              <Pressable onPress={() => { setOpen(false); setSearch('') }}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Search */}
            {searchable && (
              <View className="flex-row items-center gap-2 px-4 py-2 border-b border-gray-100">
                <Ionicons name="search" size={16} color="#9CA3AF" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search…"
                  placeholderTextColor="#D1D5DB"
                  className="flex-1 text-sm text-gray-900"
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
                  className={`flex-row items-center justify-between px-4 py-3 ${
                    item.value === value ? 'bg-primary/5' : ''
                  }`}
                >
                  <Text
                    className={`text-sm flex-1 ${
                      item.value === value ? 'text-primary font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color="#5B4FCF" />
                  )}
                </Pressable>
              )}
              ListEmptyComponent={
                <View className="items-center py-8">
                  <Text className="text-sm text-gray-400">No results</Text>
                </View>
              }
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  )
}
