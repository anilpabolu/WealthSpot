/**
 * Sign-in screen — Netegron Mobile.
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
  ScrollView,
  Image,
  Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSignIn } from '@clerk/clerk-expo'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'
import WLogo3D from '@/components/ui/WLogo3D'

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

  const screenWidth = Dimensions.get('window').width
  const [bannerError, setBannerError] = useState(false)

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.bgBase }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Marketing banner image with gold double-border ─── */}
        <View style={{ marginBottom: 28 }}>
          {/* Outer gold border */}
          <View
            style={{
              borderWidth: 2,
              borderColor: 'rgba(212,175,55,0.75)',
              borderRadius: 20,
              padding: 3,
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 6,
            }}
          >
            {/* Dark gap */}
            <View
              style={{
                backgroundColor: isDark ? '#0c0a1f' : '#0b1120',
                borderRadius: 17,
                padding: 3,
              }}
            >
              {/* Inner gold border */}
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: 'rgba(212,175,55,0.38)',
                  borderRadius: 14,
                  overflow: 'hidden',
                }}
              >
                {bannerError ? (
                  /* Branded fallback */
                  <View
                    style={{
                      width: '100%',
                      aspectRatio: 1.78,
                      backgroundColor: '#0b1120',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      padding: 20,
                    }}
                  >
                    <Text style={{ color: 'rgba(212,175,55,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' }}>
                      Netegron Club
                    </Text>
                    <Text style={{ color: '#ffffff', fontSize: 22, fontWeight: '800', textAlign: 'center', lineHeight: 28 }}>
                      Secure tomorrow&apos;s{`\n`}value today.
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, textAlign: 'center', lineHeight: 16 }}>
                      Invest early in prime land. Build value.
                    </Text>
                  </View>
                ) : (
                  <Image
                    // eslint-disable-next-line @typescript-eslint/no-require-imports
                    source={require('../assets/netegron-club-banner.jpg')}
                    style={{ width: screenWidth - 56, aspectRatio: 1.78 }}
                    resizeMode="cover"
                    onError={() => setBannerError(true)}
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ─── Logo / heading ─── */}
        <View style={{ marginBottom: 32, alignItems: 'center' }}>
          <WLogo3D size={64} spin />
          <Text
            style={{
              color: colors.gold,
              fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }),
              fontSize: 30,
              fontWeight: '800',
              letterSpacing: -0.4,
              marginTop: 12,
              marginBottom: 2,
            }}
          >
            Netegron
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
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
          By signing in you agree to Netegron&apos;s Terms of Service and Privacy Policy.
          SEBI-registered investment advisor.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
