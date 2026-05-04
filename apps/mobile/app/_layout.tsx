/**
 * Root layout for Expo Router.
 *
 * Wires together:
 *  - ClerkProvider (Clerk identity, falls back to raw-JWT mode if key absent)
 *  - React Query (QueryClientProvider)
 *  - Biometric gate — runs on cold start and every foreground resume (>2 min gap)
 *  - Push notification handler — registers token after auth; deep-links notification taps
 */

import { Stack, router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useRef, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { ClerkProvider } from '@clerk/clerk-expo'
import * as SecureStore from 'expo-secure-store'
import * as Notifications from 'expo-notifications'

import { useThemeStore } from '../src/stores/theme.store'
import { getThemeColors } from '../src/lib/theme'
import { biometricGate } from '../src/lib/biometric'
import { registerForPushAsync } from '../src/lib/push'
import { useUserStore } from '../src/stores/user.store'
import { setOnAuthFailure } from '../src/lib/api'
import { OfflineQueueProvider } from '../src/lib/offlineQueue'
import { useClerkBackendSync } from '../src/hooks/useClerkBackendSync'

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

// ── Clerk token cache backed by SecureStore ──────────────────────────────────
// Required by ClerkProvider on Expo — persists Clerk's session token securely.
const clerkTokenCache = {
  getToken: async (key: string) => {
    try { return await SecureStore.getItemAsync(key) } catch { return null }
  },
  saveToken: async (key: string, value: string) => {
    try { await SecureStore.setItemAsync(key, value) } catch { /* best-effort */ }
  },
  clearToken: async (key: string) => {
    try { await SecureStore.deleteItemAsync(key) } catch { /* best-effort */ }
  },
}

const CLERK_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''

// ── Notification deep-link routing ──────────────────────────────────────────
// Maps the `screen` field from a notification payload to an app route.
function handleNotificationRoute(data?: Record<string, unknown>): void {
  if (!data?.screen) return
  const screen = String(data.screen)
  // Supported deep-link targets from push payloads:
  //   { screen: 'property', slug: 'my-property-slug' }
  //   { screen: 'invest',   id:   'opp-uuid' }
  //   { screen: 'portfolio' }
  //   { screen: 'kyc' }
  if (screen === 'property' && data.slug) {
    router.push(`/property/${data.slug}`)
  } else if (screen === 'invest' && data.id) {
    router.push(`/invest/${data.id}`)
  } else if (screen === 'portfolio') {
    router.push('/(tabs)/portfolio')
  } else if (screen === 'kyc') {
    router.push('/kyc')
  }
}

const BIOMETRIC_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 2 },
  },
})

// ── Inner layout (needs access to stores) ───────────────────────────────────
function InnerLayout() {
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)
  const { isAuthenticated, logout } = useUserStore()

  // Sync Clerk identity → backend JWT (no-op when Clerk is not configured).
  useClerkBackendSync()

  // Track last time the app was in foreground to throttle biometric prompts.
  const lastForegroundRef = useRef<number>(Date.now())
  // Track push token so we can unregister on logout.
  const pushTokenRef = useRef<string | null>(null)

  // ── Auth-failure callback ────────────────────────────────────────────────
  // Called by the API client when token refresh fails — clear store and
  // navigate the user back to sign-in.
  useEffect(() => {
    setOnAuthFailure(async () => {
      await logout()
      router.replace('/sign-in')
    })
  }, [logout])

  // ── Biometric gate on foreground resume ──────────────────────────────────
  const runBiometricGate = useCallback(async () => {
    const result = await biometricGate('Unlock WealthSpot')
    if (!result.ok) {
      // User cancelled or failed biometric — sign them out for safety.
      await logout()
      router.replace('/')
    }
  }, [logout])

  useEffect(() => {
    // Cold-start biometric check.
    if (isAuthenticated) {
      runBiometricGate()
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const elapsed = Date.now() - lastForegroundRef.current
        if (elapsed > BIOMETRIC_TIMEOUT_MS && isAuthenticated) {
          runBiometricGate()
        }
        lastForegroundRef.current = Date.now()
      } else if (nextState === 'background') {
        lastForegroundRef.current = Date.now()
      }
    })
    return () => subscription.remove()
  }, [isAuthenticated, runBiometricGate])

  // ── Push notification registration ───────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return

    registerForPushAsync().then((result) => {
      if (result) pushTokenRef.current = result.token
    })

    // Notification tap → deep link (app in background/killed when tapped).
    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>
      handleNotificationRoute(data)
    })

    return () => {
      tapSub.remove()
      // Unregister push token when the session ends (effect cleanup on
      // isAuthenticated flip to false).
    }
  }, [isAuthenticated])

  // ── Notification tap when app is foregrounded ────────────────────────────
  useEffect(() => {
    const fgSub = Notifications.addNotificationReceivedListener((notification) => {
      // Foreground notifications are shown as alerts (configured in push.ts).
      // No routing action needed — user taps the alert to open.
      void notification
    })
    return () => fgSub.remove()
  }, [])

  return (
    <>
      <OfflineQueueProvider />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' },
          headerTintColor: isDark ? colors.gold : '#5B4FCF',
          headerTitleStyle: { fontWeight: '700', fontFamily: 'BricolageGrotesque' },
          contentStyle: { backgroundColor: colors.bgBase },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
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
    </>
  )
}

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

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  const layout = (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="auto" />
      <InnerLayout />
    </QueryClientProvider>
  )

  // Wrap with ClerkProvider only when the publishable key is configured.
  // This lets the app run in dev without Clerk credentials while still
  // working correctly in production.
  if (CLERK_KEY) {
    return (
      <ClerkProvider publishableKey={CLERK_KEY} tokenCache={clerkTokenCache}>
        {layout}
      </ClerkProvider>
    )
  }

  return layout
}
