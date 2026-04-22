import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react-native'
import { ASSESSMENT_CATEGORIES, iconForCategory } from '../../lib/assessments'
import { useThemeStore } from '../../stores/theme.store'
import { getThemeColors } from '../../lib/theme'

interface ShieldInfoSheetProps {
  visible: boolean
  onClose: () => void
  initialCategory?: string
}

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
 * Infographic-style bottom sheet — alternating L/R accent cards with
 * numbered badges, descriptions, and sub-item chips.
 */
export function ShieldInfoSheet({ visible, onClose, initialCategory }: ShieldInfoSheetProps) {
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: isDark ? colors.bgBase : '#FFFFFF' }}>
        {/* Header */}
        <View className="px-5 py-4" style={{ borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6', backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ECFDF5' }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center gap-1.5 mb-1">
                <ShieldCheck size={16} color="#10b981" />
                <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                  WealthSpot Shield
                </Text>
              </View>
              <Text className="text-lg font-bold" style={{ color: colors.textPrimary }}>
                7 layers of trust
              </Text>
              <Text className="text-xs mt-0.5 leading-4" style={{ color: colors.textSecondary }}>
                Every opportunity is independently verified before listing.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={20} color={isDark ? '#CBD5E1' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Infographic layers */}
        <ScrollView className="flex-1 px-5 py-4">
          {ASSESSMENT_CATEGORIES.map((cat, idx) => {
            const Icon = iconForCategory(cat.icon)
            const hex = ACCENT_HEX[cat.accentColor] ?? '#6b7280'
            const isLeft = idx % 2 === 0
            const highlight = initialCategory === cat.code

            return (
              <View key={cat.code} className="mb-4">
                <View
                  className={`rounded-xl p-4 ${isLeft ? 'mr-4' : 'ml-4'}`}
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                    [isLeft ? 'borderLeftWidth' : 'borderRightWidth']: 3,
                    [isLeft ? 'borderLeftColor' : 'borderRightColor']: hex,
                    ...(highlight ? { borderWidth: 2, borderColor: hex, backgroundColor: `${hex}08` } : {}),
                  }}
                >
                  {/* Number badge */}
                  <View
                    className={`absolute -top-2 w-5 h-5 rounded-full items-center justify-center ${isLeft ? 'left-3' : 'right-3'}`}
                    style={{ backgroundColor: hex }}
                  >
                    <Text className="text-[10px] font-bold text-white">{idx + 1}</Text>
                  </View>

                  {/* Title */}
                  <View className={`flex-row items-center gap-2 mt-1 ${isLeft ? '' : 'flex-row-reverse'}`}>
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${hex}18` }}
                    >
                      <Icon size={16} color={hex} />
                    </View>
                    <View className={`flex-1 ${isLeft ? '' : 'items-end'}`}>
                      <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>{cat.name}</Text>
                      <Text className="text-[10px] uppercase tracking-wider" style={{ color: colors.textTertiary }}>
                        Verified by{' '}
                        {cat.performedBy === 'law_firm'
                          ? 'Law Firm'
                          : cat.performedBy === 'sme'
                            ? 'SME Panel'
                            : 'WealthSpot'}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  <Text className={`text-xs leading-5 mt-2 ${isLeft ? '' : 'text-right'}`} style={{ color: colors.textSecondary }}>
                    {cat.fullDescription}
                  </Text>

                  {/* Sub-item chips */}
                  <View className={`flex-row flex-wrap gap-1.5 mt-2.5 ${isLeft ? '' : 'justify-end'}`}>
                    {cat.subItems.map((s) => (
                      <View
                        key={s.code}
                        className="flex-row items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB' }}
                      >
                        <CheckCircle2 size={9} color={hex} />
                        <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Connector */}
                {idx < ASSESSMENT_CATEGORIES.length - 1 && (
                  <View
                    className={`h-3 w-px ${isLeft ? 'ml-6' : 'self-end mr-6'}`}
                    style={{ backgroundColor: `${hex}30` }}
                  />
                )}
              </View>
            )
          })}

          <View className="py-3 mb-6">
            <Text className="text-[11px] text-center" style={{ color: colors.textTertiary }}>
              All assessments refreshed quarterly. Documents independently verified.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  )
}
