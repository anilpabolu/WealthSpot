/**
 * Tab layout – bottom navigation for main screens.
 * Screen 9-12 from Visily wireframes (mobile equivalents).
 */

import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useUserStore } from '@/stores/user.store'
import { useOverallProgress } from '@/hooks/useProfiling'

type TabIconProps = { color: string; size: number }

export default function TabLayout() {
  const user = useUserStore((s) => s.user)
  const { data: overall } = useOverallProgress()
  const isInvestor = user?.role === 'investor'
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'
  const hasAnyDna = overall
    ? Object.values(overall.vaults).some((v) => v.isComplete)
    : false
  const showPortfolio = isAdmin || (isInvestor && hasAnyDna)

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#5B4FCF',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          shadowColor: '#1B2A4A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1F2937',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Invest',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          href: showPortfolio ? '/portfolio' : null,
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }: TabIconProps) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
