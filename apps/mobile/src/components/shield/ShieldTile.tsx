import { Text, TouchableOpacity, View } from 'react-native'
import { findCategory, iconForCategory } from '../../lib/assessments'
import { ShieldDot } from './ShieldDot'
import { useThemeStore } from '../../stores/theme.store'
import { getThemeColors } from '../../lib/theme'

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
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)
  const cat = findCategory(code)
  if (!cat) return null
  const Icon = iconForCategory(cat.icon)
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="w-40 mr-2.5 rounded-xl p-3"
      style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF', borderWidth: 1, borderColor: isDark ? colors.borderSubtle : '#E5E7EB' }}
    >
      <View className="flex-row items-center gap-2">
        <Icon size={16} color={isDark ? '#94a3b8' : '#475569'} />
        <Text className="text-xs font-semibold flex-1" style={{ color: colors.textPrimary }} numberOfLines={1}>
          {cat.name}
        </Text>
        {status && <ShieldDot status={status} size="sm" />}
      </View>
      <Text className="text-[10px] mt-1" style={{ color: colors.textSecondary }} numberOfLines={2}>
        {cat.heroShortDef}
      </Text>
    </TouchableOpacity>
  )
}
