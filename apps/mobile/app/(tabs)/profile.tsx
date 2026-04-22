/**
 * Screen 13: Mobile Profile / Settings.
 * User info, KYC status, settings, referral code.
 */

import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native'
import { Link, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/hooks/useAuth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { useProfileCompletion } from '@/hooks/useProfileCompletion'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'
import { Badge } from '@/components/ui'

const MENU_ITEMS = [
  { icon: 'person-outline' as const, label: 'Personal Details', route: '/kyc' },
  { icon: 'shield-checkmark-outline' as const, label: 'KYC Verification', route: '/kyc' },
  { icon: 'wallet-outline' as const, label: 'Bank Accounts', route: '/settings' },
  { icon: 'document-text-outline' as const, label: 'Tax Documents', route: '/settings' },
  { icon: 'people-outline' as const, label: 'Refer & Earn', route: '/referral' },
  { icon: 'notifications-outline' as const, label: 'Notifications', route: '/settings' },
  { icon: 'help-circle-outline' as const, label: 'Help & Support', route: '/settings' },
  { icon: 'information-circle-outline' as const, label: 'About WealthSpot', route: '/settings' },
]

export default function ProfileScreen() {
  const { signOut } = useAuth()
  const { data: user } = useUserProfile()
  const { percentage } = useProfileCompletion()
  const resolved = useThemeStore((s) => s.resolved)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {
        signOut()
        router.replace('/')
      }},
    ])
  }

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Profile Header */}
      <View style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' }} className="px-4 pt-6 pb-5">
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mr-4">
            <Text className="text-white text-xl font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </Text>
          </View>
          <View className="flex-1">
            <Text style={{ color: colors.textPrimary }} className="font-bold text-lg">
              {user?.fullName || 'Investor'}
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-sm">{user?.email || 'investor@wealthspot.in'}</Text>
          </View>
          <Pressable style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }} className="rounded-full p-2">
            <Ionicons name="create-outline" size={18} color={isDark ? colors.gold : '#5B4FCF'} />
          </Pressable>
        </View>

        {/* KYC Status Banner */}
        <View className={`mt-4 rounded-xl p-3 flex-row items-center ${
          user?.kycStatus === 'APPROVED' ? 'bg-emerald-50' : 'bg-amber-50'
        }`}>
          <Badge
            variant={user?.kycStatus === 'APPROVED' ? 'success' : 'warning'}
            dot
            size="sm"
            icon={
              <Ionicons
                name={user?.kycStatus === 'APPROVED' ? 'checkmark-circle' : 'alert-circle'}
                size={14}
                color={user?.kycStatus === 'APPROVED' ? '#059669' : '#D97706'}
              />
            }
          >
            {user?.kycStatus === 'APPROVED' ? 'KYC Verified' : 'KYC Pending'}
          </Badge>
          {user?.kycStatus !== 'APPROVED' && (
            <Link href="/kyc" asChild>
              <Pressable className="ml-auto">
                <Text className="text-primary text-sm font-bold">Complete →</Text>
              </Pressable>
            </Link>
          )}
        </View>

        {/* Referral Code */}
        <View className="mt-3 bg-primary-light rounded-xl p-3 flex-row items-center">
          <Ionicons name="gift-outline" size={20} color="#5B4FCF" />
          <View className="ml-2 flex-1">
            <Text className="text-gray-600 text-xs">Your Referral Code</Text>
            <Text className="text-primary font-bold text-base">
              {user?.referralCode || 'WS-XXXXX'}
            </Text>
          </View>
          <Pressable className="bg-primary px-3 py-1.5 rounded-lg">
            <Text className="text-white text-xs font-bold">Share</Text>
          </Pressable>
        </View>
      </View>

      {/* Theme Toggle */}
      <View className="mt-2" style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' }}>
        <View className="flex-row items-center px-4 py-4 border-b" style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB' }}>
          <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F9FAFB' }}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={isDark ? colors.gold : '#5B4FCF'} />
          </View>
          <Text style={{ color: colors.textPrimary }} className="flex-1 text-sm font-medium">Dark Mode</Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#D1D5DB', true: 'rgba(212,175,55,0.4)' }}
            thumbColor={isDark ? '#D4AF37' : '#FFFFFF'}
          />
        </View>
      </View>

      {/* Menu Items */}
      <View className="mt-2" style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' }}>
        {MENU_ITEMS.map((item, index) => (
          <Pressable
            key={item.label}
            className={`flex-row items-center px-4 py-4 ${
              index < MENU_ITEMS.length - 1 ? 'border-b' : ''
            }`}
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB' }}
          >
            <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F9FAFB' }}>
              <Ionicons name={item.icon} size={18} color={isDark ? colors.gold : '#5B4FCF'} />
            </View>
            <Text style={{ color: colors.textPrimary }} className="flex-1 text-sm font-medium">{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={isDark ? 'rgba(255,255,255,0.2)' : '#D1D5DB'} />
          </Pressable>
        ))}
      </View>

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        className="mx-4 mt-4 mb-8 rounded-xl py-3.5 items-center"
        style={{
          backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#FECACA',
        }}
      >
        <Text className="text-red-500 font-semibold">Logout</Text>
      </Pressable>

      {/* Version */}
      <Text style={{ color: isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB' }} className="text-center text-xs mb-8">WealthSpot v1.0.0</Text>
    </ScrollView>
  )
}
