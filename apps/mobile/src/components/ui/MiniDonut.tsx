/**
 * MiniDonut – SVG ring/donut chart for percentage displays.
 * Synced design language with web MiniDonut component.
 */

import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

interface MiniDonutProps {
  value: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  trackColor?: string
  showLabel?: boolean
  label?: string
}

export function MiniDonut({
  value,
  size = 48,
  strokeWidth = 4,
  color = '#5B4FCF',
  trackColor = '#F3F4F6',
  showLabel = true,
  label,
}: MiniDonutProps) {
  const clamped = Math.max(0, Math.min(100, value))
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (clamped / 100) * circumference

  return (
    <View className="items-center gap-1">
      <View style={{ width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
          />
        </Svg>
        <View
          className="absolute inset-0 items-center justify-center"
          style={{ transform: [{ rotate: '90deg' }] }}
        >
          <Text className="font-mono font-bold text-gray-700" style={{ fontSize: size * 0.24 }}>
            {Math.round(clamped)}%
          </Text>
        </View>
      </View>
      {showLabel && label && (
        <Text className="text-[10px] text-gray-400 font-medium text-center leading-tight">
          {label}
        </Text>
      )}
    </View>
  )
}
