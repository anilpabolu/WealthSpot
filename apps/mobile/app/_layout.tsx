/**
 * Root layout for Expo Router.
 */

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { useThemeStore } from '../src/stores/theme.store'
import { getThemeColors } from '../src/lib/theme'

import {
  BricolageGrotesque_400Regular,
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque'
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import {
  FiraCode_400Regular,
  FiraCode_500Medium,
} from '@expo-google-fonts/fira-code'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 2 },
  },
})

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque: BricolageGrotesque_400Regular,
    'BricolageGrotesque-SemiBold': BricolageGrotesque_600SemiBold,
    'BricolageGrotesque-Bold': BricolageGrotesque_700Bold,
    'BricolageGrotesque-ExtraBold': BricolageGrotesque_800ExtraBold,
    PlusJakartaSans: PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    FiraCode: FiraCode_400Regular,
    'FiraCode-Medium': FiraCode_500Medium,
  })
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' },
          headerTintColor: isDark ? colors.gold : '#5B4FCF',
          headerTitleStyle: { fontWeight: '700', fontFamily: 'BricolageGrotesque' },
          contentStyle: { backgroundColor: colors.bgBase },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="select-persona" options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="property/[slug]" options={{ title: 'Property Details' }} />
        <Stack.Screen name="invest/[id]" options={{ title: 'Invest', presentation: 'modal' }} />
        <Stack.Screen name="kyc" options={{ title: 'KYC Verification' }} />
        <Stack.Screen
          name="profiling"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </QueryClientProvider>
  )
}
