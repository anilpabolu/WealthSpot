import { useState } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { ShieldCheck, ChevronRight } from 'lucide-react-native'
import { ASSESSMENT_CATEGORIES, iconForCategory } from '../../lib/assessments'
import { ShieldDot } from './ShieldDot'
import { ShieldInfoSheet } from './ShieldInfoSheet'
import { useThemeStore } from '../../stores/theme.store'
import { getThemeColors } from '../../lib/theme'

const ACCENT_HEX: Record<string, string> = {
  'text-emerald-500': '#10b981',
  'text-sky-500': '#0ea5e9',
  'text-amber-500': '#f59e0b',
  'text-fuchsia-500': '#d946ef',
  'text-blue-500': '#3b82f6',
  'text-rose-500': '#f43f5e',
  'text-violet-500': '#8b5cf6',
}

/**
 * Staggered single-column Shield strip for mobile marketplace.
 * Alternating left/right accent borders. Display-only — only "Learn more" opens the sheet.
 */
export function ShieldHeroStrip() {
  const [open, setOpen] = useState(false)
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  return (
    <View className="px-5 py-3">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1.5">
          <ShieldCheck size={13} color="#10b981" />
          <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Shield Certified
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setOpen(true)}
          className="flex-row items-center gap-0.5"
        >
          <Text className="text-[10px]" style={{ color: isDark ? colors.gold : '#818cf8' }}>Learn more</Text>
          <ChevronRight size={10} color={isDark ? colors.gold : '#818cf8'} />
        </TouchableOpacity>
      </View>

      {/* Staggered layers */}
      <View className="gap-0.5">
        {ASSESSMENT_CATEGORIES.map((cat, idx) => {
          const Icon = iconForCategory(cat.icon)
          const hex = ACCENT_HEX[cat.accentColor] ?? '#6b7280'
          const isLeft = idx % 2 === 0
          return (
            <View
              key={cat.code}
              className={`flex-row items-center gap-1.5 py-[3px] rounded-md ${
                isLeft ? 'pl-2 pr-1' : 'pr-2 pl-1 flex-row-reverse'
              }`}
              style={{
                [isLeft ? 'borderLeftWidth' : 'borderRightWidth']: 2,
                [isLeft ? 'borderLeftColor' : 'borderRightColor']: hex,
              }}
            >
              <View
                className="w-5 h-5 rounded-full items-center justify-center"
                style={{ backgroundColor: `${hex}15` }}
              >
                <Icon size={12} color={hex} />
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-[10px] font-semibold" style={{ color: colors.textPrimary }}>
                  {cat.name.replace(' Assessment', '')}
                </Text>
                <ShieldDot status="passed" size="sm" />
              </View>
            </View>
          )
        })}
      </View>

      <ShieldInfoSheet
        visible={open}
        onClose={() => setOpen(false)}
      />
    </View>
  )
}
