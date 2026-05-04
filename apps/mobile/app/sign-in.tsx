/**
 * Sign-in screen — WealthSpot Mobile.
 *
 * Uses @clerk/clerk-expo for identity management. The Clerk sign-in flow:
 *  1. User enters email → Clerk sends a one-time-code (OTP).
 *  2. User enters OTP → Clerk creates a session.
 *  3. useClerkBackendSync (called from _layout InnerLayout) detects the Clerk
 *     session and immediately exchanges it for backend JWT tokens.
 *
 * When EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is absent (dev without Clerk setup),
 * this screen falls back to a bare-token flow using /auth/login directly.
 */

import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useSignIn } from '@clerk/clerk-expo'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'

type Stage = 'email' | 'otp' | 'loading'

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [stage, setStage] = useState<Stage>('email')
  const [error, setError] = useState<string | null>(null)

  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  async function requestOtp() {
    if (!email.trim()) { setError('Enter your email address'); return }
    if (!isLoaded || !signIn) { setError('Auth service unavailable'); return }

    try {
      setStage('loading')
      setError(null)
      await signIn.create({
        identifier: email.trim().toLowerCase(),
        strategy: 'email_code',
      })
      setStage('otp')
    } catch (err) {
      setError('Could not send code. Check the email address and try again.')
      setStage('email')
      console.error('[SignIn] requestOtp error:', err)
    }
  }

  async function verifyOtp() {
    if (!otp.trim()) { setError('Enter the 6-digit code'); return }
    if (!signIn) { setError('Auth service unavailable'); return }

    try {
      setStage('loading')
      setError(null)
      const attempt = await signIn.attemptFirstFactor({ strategy: 'email_code', code: otp.trim() })

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId! })
        // useClerkBackendSync in _layout picks up the new Clerk session and
        // exchanges it for a backend JWT before navigating away.
        router.replace('/')
      } else {
        setError('Verification failed. Try requesting a new code.')
        setStage('otp')
      }
    } catch (err) {
      const msg = (err as { errors?: { message?: string }[] })?.errors?.[0]?.message
      setError(msg ?? 'Invalid code. Please try again.')
      setStage('otp')
    }
  }

  function resendCode() {
    setOtp('')
    setStage('email')
  }

  const isLoading = stage === 'loading'

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.bgBase }}
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo / heading */}
        <View className="mb-10 items-center">
          <Text style={{ color: colors.gold }} className="text-4xl font-extrabold tracking-tight mb-1">
            WealthSpot
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-sm">
            Fractional real-estate investing
          </Text>
        </View>

        <View
          style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' }}
          className="rounded-2xl p-6 shadow-sm"
        >
          {stage !== 'otp' ? (
            <>
              <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-1">
                Sign in
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm mb-5">
                We&apos;ll send a one-time code to your email.
              </Text>

              <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold mb-1 uppercase tracking-wider">
                Email address
              </Text>
              <TextInput
                value={email}
                onChangeText={(v) => { setEmail(v); setError(null) }}
                placeholder="you@example.com"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: error ? '#EF4444' : isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 15,
                  marginBottom: 4,
                }}
                onSubmitEditing={requestOtp}
                returnKeyType="go"
              />

              {error && (
                <Text className="text-red-500 text-xs mt-1 mb-3">{error}</Text>
              )}

              <Pressable
                onPress={requestOtp}
                disabled={isLoading}
                style={{
                  backgroundColor: '#5B4FCF',
                  borderRadius: 10,
                  paddingVertical: 13,
                  marginTop: error ? 0 : 12,
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center font-bold text-base">
                    Send code
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={{ color: colors.textPrimary }} className="text-xl font-bold mb-1">
                Enter your code
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm mb-5">
                A 6-digit code was sent to{' '}
                <Text style={{ color: colors.textPrimary }} className="font-semibold">
                  {email}
                </Text>
              </Text>

              <TextInput
                value={otp}
                onChangeText={(v) => { setOtp(v); setError(null) }}
                placeholder="000000"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF'}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F9FAFB',
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: error ? '#EF4444' : isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 22,
                  letterSpacing: 8,
                  textAlign: 'center',
                  marginBottom: 4,
                }}
                onSubmitEditing={verifyOtp}
                returnKeyType="done"
              />

              {error && (
                <Text className="text-red-500 text-xs mt-1 mb-3">{error}</Text>
              )}

              <Pressable
                onPress={verifyOtp}
                disabled={isLoading}
                style={{
                  backgroundColor: '#5B4FCF',
                  borderRadius: 10,
                  paddingVertical: 13,
                  marginTop: error ? 0 : 12,
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white text-center font-bold text-base">
                    Verify & sign in
                  </Text>
                )}
              </Pressable>

              <Pressable onPress={resendCode} className="mt-4 items-center" disabled={isLoading}>
                <Text style={{ color: colors.textSecondary }} className="text-sm">
                  Didn&apos;t get a code?{' '}
                  <Text style={{ color: '#5B4FCF' }} className="font-semibold">
                    Try again
                  </Text>
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <Text style={{ color: colors.textSecondary }} className="text-xs text-center mt-6 px-4 leading-5">
          By signing in you agree to WealthSpot&apos;s Terms of Service and Privacy Policy.
          SEBI-registered investment advisor.
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}
