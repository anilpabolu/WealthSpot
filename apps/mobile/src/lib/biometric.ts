/**
 * Biometric (Face ID / Touch ID / fingerprint) gate.
 *
 * The app calls `biometricGate()` on cold start (and resume from background
 * after >2 min) before unlocking authenticated state. If the device has no
 * enrolled biometric, the gate falls open — we don't want to lock users out
 * of their own app on day one. The "ws-biometric-required" SecureStore flag
 * lets users opt into hard-required biometric in Settings.
 */

import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

const REQUIRED_KEY = 'ws-biometric-required'

export async function isBiometricSupported(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  if (!hasHardware) return false
  const enrolled = await LocalAuthentication.isEnrolledAsync()
  return enrolled
}

export async function isBiometricRequired(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(REQUIRED_KEY)) === '1'
  } catch {
    return false
  }
}

export async function setBiometricRequired(required: boolean): Promise<void> {
  if (required) {
    await SecureStore.setItemAsync(REQUIRED_KEY, '1')
  } else {
    await SecureStore.deleteItemAsync(REQUIRED_KEY)
  }
}

export interface BiometricGateResult {
  /** true means the gate let the user through. */
  ok: boolean
  /** Why we let them through (or didn't) — useful for diagnostics. */
  reason:
    | 'authenticated'
    | 'no-hardware'
    | 'not-enrolled'
    | 'not-required'
    | 'cancelled'
    | 'failed'
}

/**
 * Prompt for biometric auth. Returns `{ ok: true }` if the gate should let
 * the user proceed. Soft-fails to `ok: true` when biometric isn't enforced
 * by the user — only returns false when the user has *explicitly* enabled
 * biometric and we couldn't verify them.
 */
export async function biometricGate(
  promptMessage = 'Unlock Netegron',
): Promise<BiometricGateResult> {
  const required = await isBiometricRequired()
  if (!required) {
    return { ok: true, reason: 'not-required' }
  }

  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  if (!hasHardware) {
    // The user opted in but the hardware no longer supports it — fall open
    // rather than bricking them out.
    return { ok: true, reason: 'no-hardware' }
  }
  const enrolled = await LocalAuthentication.isEnrolledAsync()
  if (!enrolled) {
    return { ok: true, reason: 'not-enrolled' }
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    fallbackLabel: 'Use passcode',
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
  })

  if (result.success) return { ok: true, reason: 'authenticated' }
  if (result.error === 'user_cancel' || result.error === 'system_cancel') {
    return { ok: false, reason: 'cancelled' }
  }
  return { ok: false, reason: 'failed' }
}
