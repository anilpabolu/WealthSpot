/**
 * Screen 10: Mobile Marketplace.
 * Grid of properties with search & filter chips.
 */

import { View, Text, ScrollView, Pressable, Image, TextInput, FlatList } from 'react-native'
import { Link } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { formatINR } from '@/lib/formatters'

const FILTER_CHIPS = ['All', 'Residential', 'Commercial', 'Warehousing', 'Plotted']

const PROPERTIES = [
  {
    id: '1', slug: 'prestige-lakeside',
    title: 'Prestige Lakeside Habitat', city: 'Bengaluru',
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=300',
    targetIrr: 14.5, minInvestment: 25000, fundingPct: 72, assetType: 'Residential',
  },
  {
    id: '2', slug: 'brigade-tech-park',
    title: 'Brigade Tech Park', city: 'Hyderabad',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300',
    targetIrr: 16.2, minInvestment: 50000, fundingPct: 45, assetType: 'Commercial',
  },
  {
    id: '3', slug: 'godrej-aqua',
    title: 'Godrej Aqua Phase II', city: 'Pune',
    coverImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300',
    targetIrr: 13.8, minInvestment: 10000, fundingPct: 89, assetType: 'Residential',
  },
  {
    id: '4', slug: 'dlf-cyber-hub',
    title: 'DLF Cyber Hub Tower', city: 'Gurugram',
    coverImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300',
    targetIrr: 15.0, minInvestment: 100000, fundingPct: 34, assetType: 'Commercial',
  },
  {
    id: '5', slug: 'mahindra-world-city',
    title: 'Mahindra World City Plots', city: 'Chennai',
    coverImage: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=300',
    targetIrr: 12.5, minInvestment: 15000, fundingPct: 61, assetType: 'Plotted',
  },
  {
    id: '6', slug: 'embassy-warehouse',
    title: 'Embassy Industrial Park', city: 'Bengaluru',
    coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=300',
    targetIrr: 11.8, minInvestment: 75000, fundingPct: 55, assetType: 'Warehousing',
  },
]

export default function MarketplaceScreen() {
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = PROPERTIES.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase())
    const matchFilter = activeFilter === 'All' || p.assetType === activeFilter
    return matchSearch && matchFilter
  })

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
            onPress={() => setActiveFilter(chip)}
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
        data={filtered}
        numColumns={2}
        keyExtractor={(item: typeof filtered[number]) => item.id}
        contentContainerStyle={{ padding: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-3 text-center">No properties found</Text>
          </View>
        }
        renderItem={({ item }: { item: typeof filtered[number] }) => (
          <Link href={`/property/${item.slug}`} asChild>
            <Pressable className="flex-1 bg-white rounded-xl overflow-hidden shadow-sm">
              <Image
                source={{ uri: item.coverImage }}
                className="w-full h-28"
                resizeMode="cover"
              />
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
                    style={{ width: `${item.fundingPct}%` }}
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
