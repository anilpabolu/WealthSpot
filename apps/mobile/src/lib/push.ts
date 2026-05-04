/**
 * Push notifications — Expo token retrieval + backend registration.
 *
 * Call `registerForPushAsync()` once after a successful login. It:
 *   1. Asks the OS for permission (no-op if already granted/denied).
 *   2. Fetches the device's Expo push token.
 *   3. POSTs the token to /api/v1/devices so the backend can broadcast.
 *
 * Returns the token on success, `null` if permission was denied or the
 * platform doesn't support push (Web preview, simulators, etc.).
 *
 * Pair with the foreground/tap handlers wired in `_layout.tsx` to deep-link
 * notification taps into the right route.
 */

import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { apiPost, apiDelete } from './api'

// Foreground display config — shows the alert + plays sound when the user is
// already in the app. Without this, foreground notifications are dropped on
// the floor by default.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

type RegisterResult =
  | { token: string; platform: 'ios' | 'android' | 'web' }
  | null

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#5B4FCF',
  })
}

export async function registerForPushAsync(): Promise<RegisterResult> {
  // Push tokens are only meaningful on real devices (not simulators).
  if (!Device.isDevice) return null

  await ensureAndroidChannel()

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync()
    status = requested.status
  }
  if (status !== 'granted') return null

  // EAS-managed builds need the projectId so Expo can mint a token bound to
  // the right project; fall back to manifest extras for older config shapes.
  const projectId =
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
    (Constants.easConfig?.projectId as string | undefined)

  const tokenResp = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  )
  const token = tokenResp.data
  const platform: 'ios' | 'android' | 'web' =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web'

  try {
    await apiPost('/devices', {
      push_token: token,
      platform,
      device_label: `${Device.modelName ?? 'unknown'} (${Device.osName ?? Platform.OS})`,
      app_version: Constants.expoConfig?.version,
    })
  } catch {
    // Backend registration is best-effort. The token is still valid in the
    // OS — a later launch will retry. Surface only via diagnostics.
  }

  return { token, platform }
}

export async function unregisterPushAsync(token: string): Promise<void> {
  try {
    await apiDelete(`/devices/${encodeURIComponent(token)}`)
  } catch {
    /* best-effort */
  }
}
