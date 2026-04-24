/**
 * FadeInView – Animated wrapper that fades-in and slides-up on mount.
 * Uses react-native-reanimated for 60fps native driver animations.
 */

import { useEffect } from 'react'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import type { ViewStyle } from 'react-native'

interface FadeInViewProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  translateY?: number
  style?: ViewStyle
  className?: string
}

export function FadeInView({
  children,
  delay = 0,
  duration = 500,
  translateY = 20,
  style,
  className,
}: FadeInViewProps) {
  const opacity = useSharedValue(0)
  const offset = useSharedValue(translateY)

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }))
    offset.value = withDelay(delay, withTiming(0, { duration, easing: Easing.out(Easing.cubic) }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: offset.value }],
  }))

  return (
    <Animated.View style={[animatedStyle, style]} className={className}>
      {children}
    </Animated.View>
  )
}
