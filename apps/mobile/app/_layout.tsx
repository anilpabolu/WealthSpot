/**
 * Root layout for Expo Router.
 */

import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 2 },
  },
})

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#5B4FCF',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#F8F9FA' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="property/[slug]" options={{ title: 'Property Details' }} />
        <Stack.Screen name="invest/[id]" options={{ title: 'Invest', presentation: 'modal' }} />
        <Stack.Screen name="kyc" options={{ title: 'KYC Verification' }} />
      </Stack>
    </QueryClientProvider>
  )
}
