/**
 * Referral deep-link handler.
 *
 * Inbound URLs:
 *   netegron://ref/<code>
 *   https://netegron.in/ref/<code>
 *
 * Stores the code in SecureStore and bounces to the marketplace tab so
 * sign-up / first-investment can claim the referral. The store key
 * `pending-referral-code` is read by the signup flow and cleared after
 * the API returns success on /auth/register.
 */

import { useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { View } from 'react-native'

const REFERRAL_KEY = 'pending-referral-code'

export default function ReferralHandler() {
  const { code } = useLocalSearchParams<{ code?: string }>()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (typeof code === 'string' && code.length > 0) {
        try {
          // Normalise to upper-case to match backend referral_code shape.
          await SecureStore.setItemAsync(REFERRAL_KEY, code.toUpperCase())
        } catch {
          // SecureStore can fail on Web preview — silent fallback is fine,
          // the code just won't be claimed.
        }
      }
      if (!cancelled) {
        router.replace('/(tabs)/marketplace')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [code])

  // Render nothing — this is a handler-only screen.
  return <View />
}
