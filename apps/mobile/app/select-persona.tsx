/**
 * Persona Selection Screen – mobile (Expo Router).
 * Shown after signup if personaSelectedAt is null.
 */

import { useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { apiPost } from '../src/lib/api'
import { useUserStore } from '../src/stores/user.store'

const PERSONAS = [
  { id: 'investor', label: 'Investor', desc: 'Invest in fractional real estate', emoji: '💰' },
  { id: 'builder', label: 'Builder', desc: 'List and manage properties', emoji: '🏗️' },
] as const

export default function SelectPersonaScreen() {
  const router = useRouter()
  const { user, setUser } = useUserStore()
  const [selected, setSelected] = useState<string[]>([])
  const [primary, setPrimary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
      if (next.length === 1) setPrimary(next[0])
      if (!next.includes(primary ?? '')) setPrimary(next[0] ?? null)
      return next
    })
  }

  const handleContinue = async () => {
    if (selected.length === 0 || !primary) return
    setLoading(true)
    try {
      await apiPost('/auth/select-persona', { roles: selected, primary_role: primary })
      if (user) {
        setUser({
          ...user,
          roles: selected,
          primaryRole: primary,
          personaSelectedAt: new Date().toISOString(),
        })
      }
      router.replace('/(tabs)')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Something went wrong'
      Alert.alert('Error', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
      <Text className="text-2xl font-bold text-gray-900 mb-2">Choose your persona</Text>
      <Text className="text-sm text-gray-500 mb-6">Select one or more roles. Tap again to set as primary.</Text>

      {PERSONAS.map((p) => {
        const isSelected = selected.includes(p.id)
        const isPrimary = primary === p.id
        return (
          <Pressable
            key={p.id}
            onPress={() => toggle(p.id)}
            onLongPress={() => isSelected && setPrimary(p.id)}
            className={`border rounded-xl p-4 mb-3 flex-row items-center ${
              isSelected ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white'
            }`}
          >
            <Text className="text-3xl mr-4">{p.emoji}</Text>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-semibold text-gray-900">{p.label}</Text>
                {isPrimary && (
                  <View className="bg-violet-500 px-2 py-0.5 rounded-full">
                    <Text className="text-white text-[10px] font-bold">PRIMARY</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs text-gray-500 mt-0.5">{p.desc}</Text>
            </View>
            <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
              isSelected ? 'border-violet-500 bg-violet-500' : 'border-gray-300'
            }`}>
              {isSelected && <Text className="text-white text-xs font-bold">✓</Text>}
            </View>
          </Pressable>
        )
      })}

      {selected.includes('builder') && (
        <View className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <Text className="text-xs text-amber-700">Builder access requires admin approval. You can use investor features while waiting.</Text>
        </View>
      )}

      <Pressable
        onPress={handleContinue}
        disabled={selected.length === 0 || loading}
        className={`mt-4 py-3 rounded-xl items-center ${
          selected.length > 0 ? 'bg-violet-600' : 'bg-gray-300'
        }`}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold">Continue</Text>
        )}
      </Pressable>
    </ScrollView>
  )
}
