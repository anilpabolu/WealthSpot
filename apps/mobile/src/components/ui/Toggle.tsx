/**
 * Toggle – iOS-style animated switch for React Native.
 * Synced design language with web Toggle component.
 */

import { Pressable, Text, View } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated'
import { useEffect } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  size?: 'sm' | 'md'
  disabled?: boolean
}

const SPRING = { damping: 15, stiffness: 200, mass: 0.5 }
const PRIMARY = '#5B4FCF'
const GRAY = '#D1D5DB'

export function Toggle({ checked, onChange, label, size = 'md', disabled = false }: ToggleProps) {
  const progress = useSharedValue(checked ? 1 : 0)

  useEffect(() => {
    progress.value = withSpring(checked ? 1 : 0, SPRING)
  }, [checked, progress])

  const trackW = size === 'sm' ? 32 : 40
  const trackH = size === 'sm' ? 18 : 22
  const knobSize = size === 'sm' ? 14 : 18
  const travel = trackW - knobSize - 4

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [GRAY, PRIMARY]),
  }))

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * travel + 2 }],
  }))

  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      className={`flex-row items-center gap-2.5 ${disabled ? 'opacity-50' : ''}`}
      accessibilityRole="switch"
      accessibilityState={{ checked, disabled }}
    >
      <Animated.View
        style={[trackStyle, { width: trackW, height: trackH, borderRadius: trackH / 2 }]}
      >
        <Animated.View
          style={[
            knobStyle,
            {
              width: knobSize,
              height: knobSize,
              borderRadius: knobSize / 2,
              backgroundColor: '#FFFFFF',
              position: 'absolute',
              top: 2,
            },
          ]}
        />
      </Animated.View>
      {label && (
        <Text className="text-sm text-gray-600">{label}</Text>
      )}
    </Pressable>
  )
}
