/**
 * Screen 9: Mobile Home / Feed (equivalent of Landing Page).
 * Hero banner, quick stats, featured properties, how it works.
 */

import { View, Text, ScrollView, Pressable, Image, RefreshControl } from 'react-native'
import { Link } from 'expo-router'
import { useState, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { formatINR } from '@/lib/formatters'

const STATS = [
  { label: 'Total AUM', value: '₹247 Cr' },
  { label: 'Properties', value: '58' },
  { label: 'Investors', value: '12,400+' },
  { label: 'Avg IRR', value: '14.2%' },
]

const FEATURED = [
  {
    id: '1',
    slug: 'prestige-lakeside',
    title: 'Prestige Lakeside Habitat',
    city: 'Bengaluru',
    coverImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
    targetIrr: 14.5,
    minInvestment: 25000,
    fundingPct: 72,
    assetType: 'Residential',
  },
  {
    id: '2',
    slug: 'brigade-tech-park',
    title: 'Brigade Tech Park',
    city: 'Hyderabad',
    coverImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
    targetIrr: 16.2,
    minInvestment: 50000,
    fundingPct: 45,
    assetType: 'Commercial',
  },
  {
    id: '3',
    slug: 'godrej-aqua',
    title: 'Godrej Aqua Phase II',
    city: 'Pune',
    coverImage: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
    targetIrr: 13.8,
    minInvestment: 10000,
    fundingPct: 89,
    assetType: 'Residential',
  },
]

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1500)
  }, [])

  return (
    <ScrollView
      className="flex-1 bg-surface"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5B4FCF" />
      }
    >
      {/* Hero Banner */}
      <View className="bg-primary px-5 pt-12 pb-8 rounded-b-3xl">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-white/70 text-sm">Welcome to</Text>
            <Text className="text-white text-2xl font-bold">WealthSpot</Text>
          </View>
          <Pressable className="bg-white/20 rounded-full p-2">
            <Ionicons name="notifications-outline" size={22} color="white" />
          </Pressable>
        </View>

        <Text className="text-white/80 text-sm leading-5 mb-5">
          Invest in premium real estate from ₹10,000. Earn rental income & capital appreciation.
        </Text>

        <Link href="/marketplace" asChild>
          <Pressable className="bg-white rounded-xl py-3.5 items-center">
            <Text className="text-primary font-bold text-base">Explore Properties →</Text>
          </Pressable>
        </Link>
      </View>

      {/* Stats Bar */}
      <View className="flex-row mx-4 mt-[-20] bg-white rounded-2xl p-4 shadow-sm">
        {STATS.map((stat, i) => (
          <View
            key={stat.label}
            className={`flex-1 items-center ${i < STATS.length - 1 ? 'border-r border-gray-100' : ''}`}
          >
            <Text className="text-primary font-bold text-base">{stat.value}</Text>
            <Text className="text-gray-500 text-[10px] mt-0.5">{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Featured Properties */}
      <View className="px-4 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-900">Featured Properties</Text>
          <Link href="/marketplace" asChild>
            <Pressable>
              <Text className="text-primary text-sm font-semibold">View All</Text>
            </Pressable>
          </Link>
        </View>

        {FEATURED.map((property) => (
          <Link key={property.id} href={`/property/${property.slug}`} asChild>
            <Pressable className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm">
              <Image
                source={{ uri: property.coverImage }}
                className="w-full h-40"
                resizeMode="cover"
              />
              <View className="absolute top-3 left-3 bg-primary/90 px-2.5 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">{property.assetType}</Text>
              </View>

              <View className="p-4">
                <Text className="text-gray-900 font-bold text-base">{property.title}</Text>
                <Text className="text-gray-500 text-sm mt-0.5">{property.city}</Text>

                <View className="flex-row items-center mt-3 gap-4">
                  <View>
                    <Text className="text-[10px] text-gray-400 uppercase">IRR</Text>
                    <Text className="text-emerald-600 font-bold">{property.targetIrr}%</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] text-gray-400 uppercase">Min Invest</Text>
                    <Text className="text-gray-900 font-bold">{formatINR(property.minInvestment)}</Text>
                  </View>
                </View>

                {/* Funding Bar */}
                <View className="mt-3">
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${property.fundingPct}%` }}
                    />
                  </View>
                  <Text className="text-[10px] text-gray-400 mt-1">
                    {property.fundingPct}% funded
                  </Text>
                </View>
              </View>
            </Pressable>
          </Link>
        ))}
      </View>

      {/* How It Works */}
      <View className="px-4 mt-4 mb-8">
        <Text className="text-lg font-bold text-gray-900 mb-3">How It Works</Text>
        {[
          { step: '1', title: 'Browse', desc: 'Explore RERA-verified properties' },
          { step: '2', title: 'Invest', desc: 'Start from just ₹10,000' },
          { step: '3', title: 'Earn', desc: 'Get rental income monthly' },
          { step: '4', title: 'Exit', desc: 'Sell on secondary market' },
        ].map((item) => (
          <View key={item.step} className="flex-row items-center bg-white rounded-xl p-4 mb-2">
            <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-4">
              <Text className="text-white font-bold">{item.step}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold">{item.title}</Text>
              <Text className="text-gray-500 text-sm">{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}
