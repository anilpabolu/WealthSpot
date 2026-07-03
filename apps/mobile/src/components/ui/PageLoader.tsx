/**
 * PageLoader — mobile full-screen loading screen.
 *
 * Shown while fonts are loading on cold start (replaces blank/null screen).
 * Uses:
 *  - WLogo3D for the animated 3D W logo
 *  - Reanimated for a logo zoom, violet rotating ring, and soft expanding ripple
 *  - Rotating loading messages matching the web app
 */
import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import WLogo3D from './WLogo3D'
import { useThemeStore } from '../../stores/theme.store'
import { getThemeColors } from '../../lib/theme'

const LOADING_MESSAGES = [
  'Curating premium opportunities…',
  'Preparing your portfolio view…',
  'Unlocking institutional-grade assets…',
  'Building your wealth dashboard…',
  'Fetching the latest market data…',
]

export default function PageLoader() {
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  // Single logo-led progress animation
  const logoPulse = useSharedValue(0)
  const ringRotation = useSharedValue(0)
  const ripple = useSharedValue(0)
  const rippleDelayed = useSharedValue(0)

  useEffect(() => {
    logoPulse.value = withRepeat(
      withTiming(1, {
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    )
    ringRotation.value = withRepeat(
      withTiming(1, {
        duration: 1650,
        easing: Easing.linear,
      }),
      -1,
      false,
    )
    ripple.value = withRepeat(
      withTiming(1, {
        duration: 2400,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false,
    )
    rippleDelayed.value = withDelay(
      750,
      withRepeat(
        withTiming(1, {
          duration: 2400,
          easing: Easing.out(Easing.ease),
        }),
        -1,
        false,
      ),
    )
  }, [logoPulse, ringRotation, ripple, rippleDelayed])

  const logoStageStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.96 + logoPulse.value * 0.12 }],
  }))

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.74 + logoPulse.value * 0.26,
    transform: [
      { rotate: `${ringRotation.value * 360}deg` },
      { scale: 0.98 + logoPulse.value * 0.05 },
    ],
  }))

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 0.36 * (1 - ripple.value)),
    transform: [{ scale: 0.72 + ripple.value * 0.56 }],
  }))

  const rippleDelayedStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 0.22 * (1 - rippleDelayed.value)),
    transform: [{ scale: 0.72 + rippleDelayed.value * 0.56 }],
  }))

  // Cycling loading message
  const msgIndex = useRef(Math.floor(Math.random() * LOADING_MESSAGES.length))
  const [message, setMessage] = useState(LOADING_MESSAGES[msgIndex.current])

  useEffect(() => {
    const interval = setInterval(() => {
      msgIndex.current = (msgIndex.current + 1) % LOADING_MESSAGES.length
      setMessage(LOADING_MESSAGES[msgIndex.current])
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: colors.bgBase }]}>
      {/* Single logo-led progress status */}
      <Animated.View style={[styles.logoStage, logoStageStyle]}>
        <Animated.View style={[styles.ripple, rippleStyle]} />
        <Animated.View style={[styles.rippleOuter, rippleDelayedStyle]} />
        <Animated.View style={[styles.violetRing, ringStyle]} />
        <WLogo3D size={96} spin />
      </Animated.View>

      {/* Brand text */}
      <Text style={[styles.brand, { color: isDark ? '#f1f5f9' : '#111827' }]}>
        Netegron
      </Text>

      {/* Rotating message */}
      <Text style={[styles.message, { color: isDark ? 'rgba(255,255,255,0.4)' : '#6B7280' }]}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoStage: {
    width: 156,
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  violetRing: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.45)',
    borderTopColor: 'rgba(237,233,254,0.92)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 20,
    elevation: 3,
  },
  ripple: {
    position: 'absolute',
    width: 178,
    height: 178,
    borderRadius: 89,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.2)',
    backgroundColor: 'rgba(167,139,250,0.05)',
  },
  rippleOuter: {
    position: 'absolute',
    width: 212,
    height: 212,
    borderRadius: 106,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.12)',
  },
  brand: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'BricolageGrotesque-Bold',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: '#D4AF37',
  },
  message: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
})
