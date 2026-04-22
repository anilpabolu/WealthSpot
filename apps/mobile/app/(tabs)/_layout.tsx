/**
 * Tab layout – bottom navigation for main screens.
 * Screen 9-12 from Visily wireframes (mobile equivalents).
 */

import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useUserStore } from '@/stores/user.store'
import { useOverallProgress } from '@/hooks/useProfiling'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'

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

  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#D4AF37' : '#5B4FCF',
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.35)' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
          shadowColor: isDark ? '#000000' : '#1B2A4A',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.3 : 0.06,
          shadowRadius: 12,
          elevation: 12,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
          fontFamily: 'PlusJakartaSans',
        },
        headerStyle: { backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' },
        headerTintColor: isDark ? colors.textPrimary : '#1F2937',
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
