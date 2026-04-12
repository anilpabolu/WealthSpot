/**
 * Screen 10: Mobile Marketplace.
 * Grid of properties with search & filter chips.
 */

import { View, Text, ScrollView, Pressable, Image, FlatList, ActivityIndicator } from 'react-native'
import { Link, useLocalSearchParams } from 'expo-router'
import { useState, useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { formatINR } from '@/lib/formatters'
import { useProperties } from '@/hooks/useProperties'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { EmptyState, Badge, Input } from '@/components/ui'

const FILTER_CHIPS = ['All', 'Residential', 'Commercial', 'Warehousing', 'Plotted']
const COMMUNITY_SUBTYPE_CHIPS = [
  { value: '', label: 'All' },
  { value: 'co_investor', label: 'Co-Investor' },
  { value: 'co_partner', label: 'Co-Partner' },
] as const

export default function MarketplaceScreen() {
  const { vault, subtype } = useLocalSearchParams<{ vault?: string; subtype?: string }>()
  const isCommunityVault = vault === 'community'
  const { filters, setFilter, resetFilters } = useMarketplaceStore()
  const { isVaultEnabled } = useVaultConfig()
  const isVaultDisabled = vault ? !isVaultEnabled(vault) : false
  const [search, setSearch] = useState(filters.search ?? '')
  const [activeFilter, setActiveFilter] = useState(filters.assetType ?? 'All')
  const [communitySubtype, setCommunitySubtype] = useState(subtype ?? '')

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
      {isVaultDisabled ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-3">🔒</Text>
          <Text className="text-lg font-bold text-gray-900 text-center mb-2">
            {vault === 'community' ? 'Rallying the Tribe...' : 'The Launchpad is Being Built...'}
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            {vault === 'community'
              ? 'Community Vault is coming soon. We\'re building something special for collaborative investing.'
              : 'Opportunity Vault is coming soon. Premium startup opportunities are being curated.'}
          </Text>
        </View>
      ) : (
      <>
      {/* Search Bar */}
      <View className="px-4 pt-4 pb-2 bg-white">
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2.5">
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <Input
            className="flex-1 ml-2"
            placeholder="Search properties, cities..."
            value={search}
            onChangeText={setSearch}
            size="sm"
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

      {/* Community Subtype Chips */}
      {isCommunityVault && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-white px-4 pb-3"
        >
          <View className="flex-row items-center">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mr-2">Type:</Text>
            {COMMUNITY_SUBTYPE_CHIPS.map((chip) => (
              <Pressable
                key={chip.value}
                onPress={() => setCommunitySubtype(chip.value)}
                className={`mr-2 px-4 py-1.5 rounded-full ${
                  communitySubtype === chip.value ? 'bg-emerald-600' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    communitySubtype === chip.value ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {chip.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

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
            <EmptyState
              icon="search-outline"
              title="No Properties Found"
              message="Try adjusting your search or filters"
            />
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
              <View className="absolute top-2 left-2">
                <Badge variant="purple" size="xs">{item.assetType}</Badge>
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
      </>
      )}
    </View>
  )
}
