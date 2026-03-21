/**
 * Screen 10: Mobile Marketplace.
 * Grid of properties with search & filter chips.
 */

import { View, Text, ScrollView, Pressable, Image, TextInput, FlatList, ActivityIndicator } from 'react-native'
import { Link } from 'expo-router'
import { useState, useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { formatINR } from '@/lib/formatters'
import { useProperties } from '@/hooks/useProperties'
import { useMarketplaceStore } from '@/stores/marketplace.store'

const FILTER_CHIPS = ['All', 'Residential', 'Commercial', 'Warehousing', 'Plotted']

export default function MarketplaceScreen() {
  const { filters, setFilter, resetFilters } = useMarketplaceStore()
  const [search, setSearch] = useState(filters.search ?? '')
  const [activeFilter, setActiveFilter] = useState(filters.assetType ?? 'All')

  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: search || '',
      assetType: activeFilter !== 'All' ? activeFilter : '',
    }),
    [search, activeFilter, filters],
  )

  const { data, isLoading } = useProperties(queryFilters)
  const properties = data?.properties ?? []

  const handleFilterChip = (chip: string) => {
    setActiveFilter(chip)
    setFilter('assetType', chip !== 'All' ? chip : '')
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5">
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-900"
            placeholder="Search properties, cities..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white px-4 pb-3"
      >
        {FILTER_CHIPS.map((chip) => (
          <Pressable
            key={chip}
            onPress={() => handleFilterChip(chip)}
            className={`mr-2 px-4 py-1.5 rounded-full ${
              activeFilter === chip ? 'bg-primary' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                activeFilter === chip ? 'text-white' : 'text-gray-600'
              }`}
            >
              {chip}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Property Grid */}
      <FlatList
        data={properties}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          isLoading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="large" color="#5B4FCF" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-20">
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-3 text-center">No properties found</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Link href={`/property/${item.slug}`} asChild>
            <Pressable className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm">
              {item.coverImage ? (
                <Image
                  source={{ uri: item.coverImage }}
                  className="w-full h-28"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-28 bg-gray-200 items-center justify-center">
                  <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                </View>
              )}
              <View className="absolute top-2 left-2 bg-primary/80 px-2 py-0.5 rounded-full">
                <Text className="text-white text-[10px] font-bold">{item.assetType}</Text>
              </View>
              <View className="p-3">
                <Text className="text-gray-900 font-bold text-xs" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-gray-400 text-[10px]">{item.city}</Text>
                <View className="flex-row mt-2 gap-3">
                  <View>
                    <Text className="text-[9px] text-gray-400">IRR</Text>
                    <Text className="text-emerald-600 font-bold text-xs">{item.targetIrr}%</Text>
                  </View>
                  <View>
                    <Text className="text-[9px] text-gray-400">Min</Text>
                    <Text className="text-gray-900 font-bold text-xs">{formatINR(item.minInvestment)}</Text>
                  </View>
                </View>
                <View className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${item.fundingPercentage}%` }}
                  />
                </View>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </View>
  )
}
