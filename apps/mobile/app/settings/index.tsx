import { View, Text, Switch, Pressable, ScrollView, Alert } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'
import { useAuth } from '@/hooks/useAuth'

export default function SettingsScreen() {
  const { signOut } = useAuth()
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)
  const setMode = useThemeStore((s) => s.setMode)

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await signOut()
        router.replace('/')
      }}
    ])
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <View className="flex-row items-center px-4 pt-safe pb-4 border-b" style={{ borderBottomColor: isDark ? colors.borderDefault : '#F3F4F6', backgroundColor: colors.bgCard }}>
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 mr-2">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text className="font-bold text-lg" style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>Settings</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-4 border-b" style={{ borderBottomColor: isDark ? colors.borderDefault : '#F3F4F6' }}>
          <Text className="text-xs font-bold uppercase mb-4" style={{ color: colors.textTertiary }}>Appearance</Text>
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Ionicons name="moon-outline" size={20} color={colors.textSecondary} className="mr-3" />
              <Text style={{ color: colors.textPrimary, fontSize: 16, marginLeft: 12 }}>Dark Mode</Text>
            </View>
            <Switch 
              value={isDark} 
              onValueChange={(val) => setMode(val ? 'dark' : 'light')} 
              trackColor={{ false: '#D1D5DB', true: isDark ? colors.gold : '#5B4FCF' }} 
            />
          </View>
        </View>

        <View className="p-4 border-b" style={{ borderBottomColor: isDark ? colors.borderDefault : '#F3F4F6' }}>
          <Text className="text-xs font-bold uppercase mb-4" style={{ color: colors.textTertiary }}>Account</Text>
          <Pressable className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} className="mr-3" />
              <Text style={{ color: colors.textPrimary, fontSize: 16, marginLeft: 12 }}>Push Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
          <Pressable className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center">
              <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} className="mr-3" />
              <Text style={{ color: colors.textPrimary, fontSize: 16, marginLeft: 12 }}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        <Pressable onPress={handleLogout} className="p-4 mt-6 mx-4 rounded-xl items-center" style={{ backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FEE2E2' }}>
          <Text className="font-bold" style={{ color: '#EF4444' }}>Sign Out</Text>
        </Pressable>
        <Text className="text-center text-xs mt-6" style={{ color: colors.textTertiary }}>WealthSpot v1.0.0</Text>
      </ScrollView>
    </View>
  )
}
