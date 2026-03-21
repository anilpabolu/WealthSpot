/**
 * Screen 14: Mobile Property Detail.
 * Gallery, details, investment CTA.
 */

import { View, Text, ScrollView, Pressable, Image, Dimensions, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, Link, router } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { formatINR } from '@/lib/formatters'
import { useProperty } from '@/hooks/useProperties'

const { width } = Dimensions.get('window')

export default function PropertyDetailScreen() {
  const { slug } = useLocalSearchParams()
  const { data: property, isLoading } = useProperty(slug as string)
  const [activeImage, setActiveImage] = useState(0)

  if (isLoading || !property) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#5B4FCF" />
      </View>
    )
  }

  const fundingPct = property.fundingPercentage ?? ((property.raised / property.target) * 100)
  const gallery = property.gallery.length > 0
    ? property.gallery
    : property.coverImage ? [property.coverImage] : []

  return (
    <View className="flex-1 bg-surface">
      <ScrollView className="flex-1">
        {/* Gallery */}
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e: { nativeEvent: { contentOffset: { x: number } } }) => {
            const page = Math.round(e.nativeEvent.contentOffset.x / width)
            setActiveImage(page)
          }}
          scrollEventThrottle={16}
        >
          {gallery.map((img, i) => (
            <Image
              key={i}
              source={{ uri: img }}
              style={{ width, height: 280 }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Image Dots */}
        <View className="flex-row justify-center mt-2 gap-1.5">
          {gallery.map((_, i) => (
            <View
              key={i}
              className={`w-2 h-2 rounded-full ${i === activeImage ? 'bg-primary' : 'bg-gray-300'}`}
            />
          ))}
        </View>

        <View className="px-4 mt-4">
          {/* Title */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-2 mb-1">
                <View className="bg-primary/10 px-2 py-0.5 rounded-full">
                  <Text className="text-primary text-[10px] font-bold">{property.assetType}</Text>
                </View>
                {property.reraNumber ? (
                  <View className="bg-emerald-50 px-2 py-0.5 rounded-full flex-row items-center">
                    <Ionicons name="checkmark-circle" size={10} color="#059669" />
                    <Text className="text-emerald-700 text-[10px] font-semibold ml-0.5">RERA</Text>
                  </View>
                ) : null}
              </View>
              <Text className="text-gray-900 font-bold text-xl">{property.title}</Text>
              <Text className="text-gray-500 text-sm">{property.micromarket}, {property.city}</Text>
            </View>
          </View>

          {/* Key Metrics */}
          <View className="flex-row bg-white rounded-2xl p-4 mt-4 shadow-sm">
            <View className="flex-1 items-center border-r border-gray-100">
              <Text className="text-[10px] text-gray-400 uppercase">Target IRR</Text>
              <Text className="text-emerald-600 font-bold text-lg">{property.targetIrr}%</Text>
            </View>
            <View className="flex-1 items-center border-r border-gray-100">
              <Text className="text-[10px] text-gray-400 uppercase">Min Invest</Text>
              <Text className="text-gray-900 font-bold text-lg">{formatINR(property.minInvestment)}</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-[10px] text-gray-400 uppercase">Rental Yield</Text>
              <Text className="text-blue-600 font-bold text-lg">{property.rentalYield}%</Text>
            </View>
          </View>

          {/* Funding Progress */}
          <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-sm">Funding Progress</Text>
              <Text className="text-primary font-bold">{fundingPct.toFixed(0)}%</Text>
            </View>
            <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <View className="h-full bg-primary rounded-full" style={{ width: `${Math.min(fundingPct, 100)}%` }} />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-400 text-xs">{formatINR(property.raised)} raised</Text>
              <Text className="text-gray-400 text-xs">of {formatINR(property.target)}</Text>
            </View>
            <View className="flex-row items-center mt-2">
              <Ionicons name="people-outline" size={14} color="#9CA3AF" />
              <Text className="text-gray-500 text-xs ml-1">{property.investorCount} investors</Text>
            </View>
          </View>

          {/* Description */}
          <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
            <Text className="text-gray-900 font-bold text-base mb-2">About This Property</Text>
            <Text className="text-gray-600 text-sm leading-5">{property.description}</Text>
          </View>

          {/* Details Grid */}
          <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
            <Text className="text-gray-900 font-bold text-base mb-3">Key Details</Text>
            {[
              { label: 'Area', value: property.areaSqft ? `${property.areaSqft} sq.ft` : '—' },
              { label: 'Possession', value: property.possessionDate || '—' },
              { label: 'Total Units', value: `${property.totalUnits}` },
              { label: 'Available Units', value: `${property.totalUnits - property.soldUnits}` },
              { label: 'Unit Price', value: formatINR(property.unitPrice) },
              { label: 'Builder', value: property.builderName || '—' },
            ].map((detail) => (
              <View key={detail.label} className="flex-row justify-between py-2 border-b border-gray-50">
                <Text className="text-gray-500 text-sm">{detail.label}</Text>
                <Text className="text-gray-900 font-semibold text-sm">{detail.value}</Text>
              </View>
            ))}
          </View>

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <View className="bg-white rounded-2xl p-4 mt-3 mb-24 shadow-sm">
              <Text className="text-gray-900 font-bold text-base mb-3">Amenities</Text>
              <View className="flex-row flex-wrap gap-2">
                {property.amenities.map((a) => (
                  <View key={a} className="bg-gray-50 px-3 py-1.5 rounded-full">
                    <Text className="text-gray-600 text-xs">{a}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex-row items-center">
        <View className="flex-1 mr-3">
          <Text className="text-gray-400 text-[10px]">Starting from</Text>
          <Text className="text-gray-900 font-bold text-lg">{formatINR(property.minInvestment)}</Text>
        </View>
        <Pressable
          onPress={() => router.push(`/invest/${property.id}`)}
          className="bg-primary px-8 py-3.5 rounded-xl"
        >
          <Text className="text-white font-bold text-base">INVEST NOW</Text>
        </Pressable>
      </View>
    </View>
  )
}
