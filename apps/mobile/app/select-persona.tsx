/**
 * Persona Selection Screen – mobile (Expo Router).
 * Shown after signup if personaSelectedAt is null.
 */

import { useState } from 'react'
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { apiPost } from '../src/lib/api'
import { useUserStore } from '../src/stores/user.store'
import { useThemeStore } from '../src/stores/theme.store'
import { getThemeColors } from '../src/lib/theme'

const PERSONAS = [
  { id: 'investor', label: 'Investor', desc: 'Invest in fractional real estate', emoji: '💰' },
  { id: 'builder', label: 'Builder', desc: 'List and manage properties', emoji: '🏗️' },
] as const

export default function SelectPersonaScreen() {
  const router = useRouter()
  const { user, setUser } = useUserStore()
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)
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
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bgBase }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }}>
      <Text className="text-2xl font-bold mb-2" style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>Choose your persona</Text>
      <Text className="text-sm mb-6" style={{ color: colors.textSecondary }}>Select one or more roles. Tap again to set as primary.</Text>

      {PERSONAS.map((p) => {
        const isSelected = selected.includes(p.id)
        const isPrimary = primary === p.id
        return (
          <Pressable
            key={p.id}
            onPress={() => toggle(p.id)}
            onLongPress={() => isSelected && setPrimary(p.id)}
            className="border rounded-xl p-4 mb-3 flex-row items-center"
            style={{
              borderColor: isSelected
                ? (isDark ? colors.gold : '#8B5CF6')
                : (isDark ? colors.borderSubtle : '#E5E7EB'),
              backgroundColor: isSelected
                ? (isDark ? 'rgba(212,175,55,0.12)' : '#F5F3FF')
                : (isDark ? colors.bgSurface : '#FFFFFF'),
            }}
          >
            <Text className="text-3xl mr-4">{p.emoji}</Text>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>{p.label}</Text>
                {isPrimary && (
                  <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: isDark ? colors.gold : '#8B5CF6' }}>
                    <Text className="text-[10px] font-bold" style={{ color: isDark ? '#0c0a1f' : '#FFFFFF' }}>PRIMARY</Text>
                  </View>
                )}
              </View>
              <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>{p.desc}</Text>
            </View>
            <View className="w-6 h-6 rounded-full border-2 items-center justify-center" style={{ borderColor: isSelected ? (isDark ? colors.gold : '#8B5CF6') : (isDark ? 'rgba(255,255,255,0.25)' : '#D1D5DB'), backgroundColor: isSelected ? (isDark ? colors.gold : '#8B5CF6') : 'transparent' }}>
              {isSelected && <Text className="text-xs font-bold" style={{ color: isDark ? '#0c0a1f' : '#FFFFFF' }}>✓</Text>}
            </View>
          </Pressable>
        )
      })}

      {selected.includes('builder') && (
        <View className="border rounded-xl p-3 mb-4" style={{ backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB', borderColor: isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A' }}>
          <Text className="text-xs" style={{ color: isDark ? '#FCD34D' : '#B45309' }}>Builder access requires admin approval. You can use investor features while waiting.</Text>
        </View>
      )}

      <Pressable
        onPress={handleContinue}
        disabled={selected.length === 0 || loading}
        className="mt-4 py-3 rounded-xl items-center"
        style={{ backgroundColor: selected.length > 0 ? (isDark ? colors.gold : '#7C3AED') : (isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB') }}
      >
        {loading ? (
          <ActivityIndicator color={isDark ? '#0c0a1f' : '#FFFFFF'} />
        ) : (
          <Text className="font-semibold" style={{ color: isDark ? '#0c0a1f' : '#FFFFFF' }}>Continue</Text>
        )}
      </Pressable>
    </ScrollView>
  )
}
