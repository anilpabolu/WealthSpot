import { Text, TouchableOpacity, View } from 'react-native'
import { findCategory, iconForCategory } from '../../lib/assessments'
import { ShieldDot } from './ShieldDot'

interface ShieldTileProps {
  code: string
  status?: string
  onPress?: () => void
}

/**
 * Single Shield category tile — used in the marketplace horizontal strip
 * and inside the info sheet.
 */
export function ShieldTile({ code, status, onPress }: ShieldTileProps) {
  const cat = findCategory(code)
  if (!cat) return null
  const Icon = iconForCategory(cat.icon)
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-40 mr-2.5 rounded-xl border-2 border-gray-200 bg-white p-3"
    >
      <View className="flex-row items-center gap-2">
        <Icon size={16} color="#475569" />
        <Text className="text-xs font-semibold text-gray-900 flex-1" numberOfLines={1}>
          {cat.name}
        </Text>
        {status && <ShieldDot status={status} size="sm" />}
      </View>
      <Text className="text-[10px] text-gray-500 mt-1" numberOfLines={2}>
        {cat.heroShortDef}
      </Text>
    </TouchableOpacity>
  )
}
