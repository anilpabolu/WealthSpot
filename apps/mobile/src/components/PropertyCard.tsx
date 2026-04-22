/**
 * Reusable PropertyCard for mobile – used in marketplace FlatList.
 */

import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { formatINR } from '../lib/formatters'
import { useThemeStore } from '../stores/theme.store'
import { getThemeColors } from '../lib/theme'

interface PropertyCardProps {
  id: string
  slug: string
  title: string
  city: string
  coverImage: string | null
  assetType: string
  targetIrr: number
  minInvestment: number
  fundingPercentage: number
}

export default function PropertyCard({
  slug,
  title,
  city,
  coverImage,
  assetType,
  targetIrr,
  minInvestment,
  fundingPercentage,
}: PropertyCardProps) {
  const router = useRouter()
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  return (
    <TouchableOpacity
      className="rounded-3xl overflow-hidden mb-3"
      style={{
        backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
        borderWidth: isDark ? 1 : 2,
        borderColor: isDark ? colors.cardBorder : '#E5E7EB',
        shadowColor: isDark ? '#D4AF37' : '#000',
        shadowOpacity: isDark ? 0.06 : 0.06,
        shadowRadius: isDark ? 12 : 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      }}
      activeOpacity={0.8}
      onPress={() => router.push(`/property/${slug}`)}
    >
      {coverImage ? (
        <Image source={{ uri: coverImage }} className="w-full h-40" resizeMode="cover" />
      ) : (
        <View className="w-full h-40 items-center justify-center" style={{ backgroundColor: isDark ? colors.bgCard : '#E5E7EB' }}>
          <Text className="text-sm" style={{ color: colors.textTertiary }}>No Image</Text>
        </View>
      )}

      <View className="p-3">
        <Text className="font-bold text-base" numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>
          {title}
        </Text>
        <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
          {city} · {assetType}
        </Text>

        {/* Funding bar */}
        <View className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, fundingPercentage)}%`, backgroundColor: isDark ? colors.gold : '#5B4FCF' }}
          />
        </View>
        <Text className="text-[10px] mt-0.5" style={{ color: colors.textTertiary }}>
          {fundingPercentage.toFixed(0)}% funded
        </Text>

        {/* Bottom row */}
        <View className="flex-row justify-between items-center mt-2">
          <View>
            <Text className="text-[10px]" style={{ color: colors.textTertiary }}>Min. Investment</Text>
            <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>{formatINR(minInvestment)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px]" style={{ color: colors.textTertiary }}>Target IRR</Text>
            <Text className="text-sm font-bold" style={{ color: isDark ? colors.gold : '#5B4FCF' }}>{targetIrr}%</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}
