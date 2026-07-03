/**
 * WLogo3D — mobile version.
 *
 * Renders the Netegron "W" logo with a 3D-flip rotation illusion using:
 *  - react-native-reanimated (withRepeat + withTiming + useAnimatedStyle)
 *  - react-native-svg for the gold gradient fallback W path
 *  - expo-linear-gradient for a surrounding gold ambient glow
 *
 * Falls back to SVG W if the image asset isn't placed yet.
 */
import { useEffect, useState } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Path, Circle } from 'react-native-svg'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'

interface WLogo3DProps {
  size?: number
  spin?: boolean
  light?: boolean
}

/** Premium medallion W fallback (SVG) */
function WFallback({ size }: { size: number }) {
  const stroke = Math.max(4, size / 12)
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient id="goldGradMobile" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFF7B8" />
          <Stop offset="0.45" stopColor="#D4AF37" />
          <Stop offset="0.72" stopColor="#825B12" />
          <Stop offset="1" stopColor="#FAE284" />
        </LinearGradient>
        <RadialGradient id="baseGradMobile" cx="0.35" cy="0.25" r="0.75">
          <Stop offset="0" stopColor="#1B173E" />
          <Stop offset="0.55" stopColor="#0D1029" />
          <Stop offset="1" stopColor="#040612" />
        </RadialGradient>
      </Defs>
      <Circle cx="32" cy="32" r="27" fill="url(#baseGradMobile)" stroke="url(#goldGradMobile)" strokeWidth={2.5} />
      <Circle cx="32" cy="32" r="22" stroke="#D4AF37" strokeWidth={0.8} opacity={0.55} />
      <Path
        d="M14.5 30.5C19 17 26.5 18.5 32 23C37.5 18.5 45 17 49.5 30.5"
        stroke="#D4AF37"
        strokeWidth={0.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.5}
      />
      <Path
        d="M16.5 20.5L23.6 44.2L32 28.6L40.4 44.2L47.5 20.5"
        stroke="url(#goldGradMobile)"
        strokeWidth={stroke}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  )
}

export default function WLogo3D({ size = 40, spin = true }: WLogo3DProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const angle = useSharedValue(0)

  useEffect(() => {
    if (!spin) return
    angle.value = withRepeat(
      withTiming(1, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    )
  }, [spin, angle])

  const animatedStyle = useAnimatedStyle(() => {
    // cos(θ·2π) goes 1 → 0 → -1 → 0 → 1 — perfect 3D flip illusion
    const cosValue = Math.cos(angle.value * Math.PI * 2)
    return {
      transform: [{ scaleX: cosValue }],
      opacity: 0.65 + 0.35 * Math.abs(cosValue),
    }
  })

  // Glow halo size
  const haloSize = size * 2.4

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Ambient gold glow */}
      <ExpoLinearGradient
        colors={['rgba(212,175,55,0.28)', 'rgba(212,175,55,0.08)', 'transparent']}
        style={[
          styles.glow,
          {
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
            top: -(haloSize - size) / 2,
            left: -(haloSize - size) / 2,
          },
        ]}
      />

      {/* 3D-spinning logo */}
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        {imgFailed ? (
          <WFallback size={size} />
        ) : (
          <Image
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            source={require('../../../assets/netegron-mark.png')}
            style={{ width: size, height: size }}
            resizeMode="contain"
            onError={() => setImgFailed(true)}
          />
        )}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glow: {
    position: 'absolute',
  },
})
