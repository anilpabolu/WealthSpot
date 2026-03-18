/**
 * Screen 13: Mobile Profile / Settings.
 * User info, KYC status, settings, referral code.
 */

import { View, Text, ScrollView, Pressable, Alert } from 'react-native'
import { Link, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useUserStore } from '@/stores/user.store'

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
  const { user, logout } = useUserStore()

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {
        logout()
        router.replace('/')
      }},
    ])
  }

  return (
    <ScrollView className="flex-1 bg-surface">
      {/* Profile Header */}
      <View className="bg-white px-4 pt-6 pb-5">
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mr-4">
            <Text className="text-white text-xl font-bold">
              {user?.fullName?.charAt(0) || 'U'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-bold text-lg">
              {user?.fullName || 'Investor'}
            </Text>
            <Text className="text-gray-500 text-sm">{user?.email || 'investor@wealthspot.in'}</Text>
          </View>
          <Pressable className="bg-gray-100 rounded-full p-2">
            <Ionicons name="create-outline" size={18} color="#5B4FCF" />
          </Pressable>
        </View>

        {/* KYC Status Banner */}
        <View className={`mt-4 rounded-xl p-3 flex-row items-center ${
          user?.kycStatus === 'APPROVED' ? 'bg-emerald-50' : 'bg-amber-50'
        }`}>
          <Ionicons
            name={user?.kycStatus === 'APPROVED' ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={user?.kycStatus === 'APPROVED' ? '#059669' : '#D97706'}
          />
          <Text className={`ml-2 text-sm font-semibold ${
            user?.kycStatus === 'APPROVED' ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            KYC {user?.kycStatus === 'APPROVED' ? 'Verified' : 'Pending'}
          </Text>
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

      {/* Menu Items */}
      <View className="mt-2 bg-white">
        {MENU_ITEMS.map((item, index) => (
          <Pressable
            key={item.label}
            className={`flex-row items-center px-4 py-3.5 ${
              index < MENU_ITEMS.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            <View className="w-9 h-9 rounded-xl bg-gray-50 items-center justify-center mr-3">
              <Ionicons name={item.icon} size={18} color="#5B4FCF" />
            </View>
            <Text className="flex-1 text-gray-900 text-sm font-medium">{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </Pressable>
        ))}
      </View>

      {/* Logout */}
      <Pressable
        onPress={handleLogout}
        className="mx-4 mt-4 mb-8 bg-white rounded-xl py-3.5 items-center border border-red-200"
      >
        <Text className="text-red-500 font-semibold">Logout</Text>
      </Pressable>

      {/* Version */}
      <Text className="text-center text-gray-300 text-xs mb-8">WealthSpot v1.0.0</Text>
    </ScrollView>
  )
}
