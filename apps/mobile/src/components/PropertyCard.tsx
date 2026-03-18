/**
 * Reusable PropertyCard for mobile – used in marketplace FlatList.
 */

import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { formatINR } from '../lib/formatters'

interface PropertyCardProps {
  id: string
  slug: string
  title: string
  city: string
  cover_image: string | null
  asset_type: string
  target_irr: number
  min_investment: number
  funding_percentage: number
}

export default function PropertyCard({
  slug,
  title,
  city,
  cover_image,
  asset_type,
  target_irr,
  min_investment,
  funding_percentage,
}: PropertyCardProps) {
  const router = useRouter()

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden mb-3"
      activeOpacity={0.8}
      onPress={() => router.push(`/property/${slug}`)}
    >
      {cover_image ? (
        <Image source={{ uri: cover_image }} className="w-full h-40" resizeMode="cover" />
      ) : (
        <View className="w-full h-40 bg-gray-200 items-center justify-center">
          <Text className="text-gray-400 text-sm">No Image</Text>
        </View>
      )}

      <View className="p-3">
        <Text className="font-bold text-base text-gray-900" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5">
          {city} · {asset_type}
        </Text>

        {/* Funding bar */}
        <View className="mt-2 bg-gray-100 h-2 rounded-full overflow-hidden">
          <View
            className="bg-primary h-full rounded-full"
            style={{ width: `${Math.min(100, funding_percentage)}%` }}
          />
        </View>
        <Text className="text-[10px] text-gray-400 mt-0.5">
          {funding_percentage.toFixed(0)}% funded
        </Text>

        {/* Bottom row */}
        <View className="flex-row justify-between items-center mt-2">
          <View>
            <Text className="text-[10px] text-gray-400">Min. Investment</Text>
            <Text className="text-sm font-bold text-gray-900">{formatINR(min_investment)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[10px] text-gray-400">Target IRR</Text>
            <Text className="text-sm font-bold text-primary">{target_irr}%</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}
