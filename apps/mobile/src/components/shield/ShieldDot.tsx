import { View } from 'react-native'
import { dotColorForStatus } from '../../lib/assessments'

interface ShieldDotProps {
  status: string
  size?: 'sm' | 'md'
}

/**
 * Small glowing dot that encodes a Shield status (passed / flagged /
 * in-progress / not-started / n/a).
 */
export function ShieldDot({ status, size = 'md' }: ShieldDotProps) {
  const dim = size === 'sm' ? 8 : 10
  const color = dotColorForStatus(status)
  return (
    <View
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
      }}
    />
  )
}
