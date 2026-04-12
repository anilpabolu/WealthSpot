/**
 * Screen 14: Mobile Property Detail.
 * Gallery, details, investment CTA, like/share, company info, video.
 */

import { View, Text, ScrollView, Pressable, Image, Dimensions, ActivityIndicator, Modal, Share, Linking } from 'react-native'
import { useLocalSearchParams, Link, router } from 'expo-router'
import { useState, useCallback } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { formatINR } from '@/lib/formatters'
import { Badge } from '@/components/ui'
import { useProperty } from '@/hooks/useProperties'
import { useLikeStatus, useToggleLike, useTrackShare } from '@/hooks/useOpportunityActions'

const { width } = Dimensions.get('window')

export default function PropertyDetailScreen() {
  const { slug } = useLocalSearchParams()
  const { data: property, isLoading } = useProperty(slug as string)
  const [activeImage, setActiveImage] = useState(0)
  const [showCompanySheet, setShowCompanySheet] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  // Like / Share
  const { data: likeData } = useLikeStatus(property?.id ?? '')
  const toggleLike = useToggleLike()
  const trackShare = useTrackShare()

  const handleLike = useCallback(() => {
    if (!property) return
    toggleLike.mutate(property.id)
  }, [property, toggleLike])

  const handleShare = useCallback(async () => {
    if (!property) return
    trackShare.mutate(property.id)
    try {
      await Share.share({
        message: `Check out ${property.title} on WealthSpot!\nhttps://wealthspot.in/property/${property.slug}`,
      })
    } catch { /* user cancelled */ }
  }, [property, trackShare])

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

        {/* Watch Video button */}
        {property.videoUrl ? (
          <View className="px-4 mt-2">
            <Pressable
              onPress={() => setShowVideoModal(true)}
              className="bg-black/80 self-start px-4 py-2 rounded-lg flex-row items-center gap-2"
            >
              <Ionicons name="play-circle" size={18} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold">Watch Video</Text>
            </Pressable>
          </View>
        ) : null}

        <View className="px-4 mt-4">
          {/* Title */}
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-2 mb-1">
                <Badge variant="purple" size="xs">{property.assetType}</Badge>
                {property.reraNumber ? (
                  <Badge variant="success" size="xs">RERA</Badge>
                ) : null}
              </View>
              <Text className="text-gray-900 font-bold text-xl">{property.title}</Text>
              <Text className="text-gray-500 text-sm">{property.micromarket}, {property.city}</Text>
            </View>
            {/* Like & Share */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={handleLike}
                className={`w-10 h-10 rounded-xl items-center justify-center border ${likeData?.liked ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'}`}
              >
                <Ionicons
                  name={likeData?.liked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={likeData?.liked ? '#EF4444' : '#9CA3AF'}
                />
              </Pressable>
              <Pressable
                onPress={handleShare}
                className="w-10 h-10 rounded-xl items-center justify-center border border-gray-200 bg-white"
              >
                <Ionicons name="share-social-outline" size={20} color="#9CA3AF" />
              </Pressable>
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
            <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
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

          {/* Builder / Company Card */}
          {property.builder ? (
            <Pressable
              onPress={() => setShowCompanySheet(true)}
              className="bg-white rounded-2xl p-4 mt-3 mb-24 shadow-sm"
            >
              <Text className="text-gray-900 font-bold text-base mb-3">Developer / Company</Text>
              <View className="flex-row items-center">
                {property.builderLogo ? (
                  <Image
                    source={{ uri: property.builderLogo }}
                    className="w-12 h-12 rounded-xl"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center">
                    <Ionicons name="business-outline" size={24} color="#9CA3AF" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-gray-900 font-semibold text-sm">{property.builderName}</Text>
                    {property.builder.verified && (
                      <Ionicons name="checkmark-circle" size={14} color="#5B4FCF" />
                    )}
                  </View>
                  {property.builder.reraNumber ? (
                    <Text className="text-gray-400 text-xs mt-0.5">RERA: {property.builder.reraNumber}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </View>
            </Pressable>
          ) : (
            <View className="mb-24" />
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

      {/* Video Player Modal */}
      <Modal
        visible={showVideoModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View className="flex-1 bg-black/90 items-center justify-center">
          <Pressable
            onPress={() => setShowVideoModal(false)}
            className="absolute top-12 right-4 z-10 w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <View className="w-full px-4">
            <Pressable
              onPress={() => {
                if (property?.videoUrl) Linking.openURL(property.videoUrl)
              }}
              className="bg-white/10 rounded-2xl p-8 items-center"
            >
              <Ionicons name="play-circle" size={64} color="#FFFFFF" />
              <Text className="text-white font-semibold text-base mt-4">Tap to play video</Text>
              <Text className="text-white/60 text-xs mt-1">Opens in external player</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Company Info Bottom Sheet */}
      <Modal
        visible={showCompanySheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCompanySheet(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable className="flex-1" onPress={() => setShowCompanySheet(false)} />
          <View className="bg-white rounded-t-3xl max-h-[80%]">
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>
            <ScrollView className="px-5 pb-8" bounces={false}>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 font-bold text-lg">Developer / Company</Text>
                <Pressable onPress={() => setShowCompanySheet(false)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </Pressable>
              </View>

              {/* Identity */}
              <View className="flex-row items-center gap-3 mb-5">
                {property.builderLogo ? (
                  <Image
                    source={{ uri: property.builderLogo }}
                    className="w-16 h-16 rounded-xl"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-xl bg-gray-100 items-center justify-center">
                    <Ionicons name="business-outline" size={32} color="#9CA3AF" />
                  </View>
                )}
                <View className="flex-1">
                  <View className="flex-row items-center gap-1">
                    <Text className="text-gray-900 font-bold text-xl">{property.builderName}</Text>
                    {property.builder?.verified && (
                      <Ionicons name="checkmark-circle" size={18} color="#5B4FCF" />
                    )}
                  </View>
                </View>
              </View>

              {/* Stats Row */}
              <View className="flex-row gap-3 mb-5">
                {property.builder?.experienceYears != null && (
                  <View className="flex-1 bg-primary/5 rounded-xl p-3 items-center">
                    <Ionicons name="calendar-outline" size={20} color="#5B4FCF" />
                    <Text className="text-gray-900 font-bold text-lg mt-1">{property.builder.experienceYears}+</Text>
                    <Text className="text-gray-500 text-[10px] font-medium">Years</Text>
                  </View>
                )}
                {property.builder?.projectsCompleted != null && property.builder.projectsCompleted > 0 && (
                  <View className="flex-1 bg-primary/5 rounded-xl p-3 items-center">
                    <Ionicons name="business-outline" size={20} color="#5B4FCF" />
                    <Text className="text-gray-900 font-bold text-lg mt-1">{property.builder.projectsCompleted}</Text>
                    <Text className="text-gray-500 text-[10px] font-medium">Projects</Text>
                  </View>
                )}
              </View>

              {/* About */}
              {(property.builder?.about || property.builder?.description) ? (
                <View className="mb-5">
                  <Text className="text-gray-600 text-xs font-semibold uppercase mb-2">About</Text>
                  <Text className="text-gray-600 text-sm leading-5">
                    {property.builder.about || property.builder.description}
                  </Text>
                </View>
              ) : null}

              {/* Details */}
              <View className="gap-3 mb-6">
                {property.builder?.reraNumber ? (
                  <View className="flex-row items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                    <Ionicons name="shield-checkmark-outline" size={20} color="#059669" />
                    <View>
                      <Text className="text-gray-400 text-[10px]">RERA Registration</Text>
                      <Text className="text-gray-900 font-semibold text-sm">{property.builder.reraNumber}</Text>
                    </View>
                  </View>
                ) : null}
                {property.builder?.city ? (
                  <View className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Ionicons name="location-outline" size={20} color="#9CA3AF" />
                    <View>
                      <Text className="text-gray-400 text-[10px]">Headquartered In</Text>
                      <Text className="text-gray-900 font-semibold text-sm">{property.builder.city}</Text>
                    </View>
                  </View>
                ) : null}
                {property.builder?.website ? (
                  <Pressable
                    onPress={() => Linking.openURL(property.builder!.website!)}
                    className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-xl"
                  >
                    <Ionicons name="globe-outline" size={20} color="#9CA3AF" />
                    <View>
                      <Text className="text-gray-400 text-[10px]">Website</Text>
                      <Text className="text-primary font-semibold text-sm">
                        {property.builder.website.replace(/^https?:\/\//, '')}
                      </Text>
                    </View>
                  </Pressable>
                ) : null}
              </View>

              {/* Close */}
              <Pressable
                onPress={() => setShowCompanySheet(false)}
                className="bg-gray-100 py-3 rounded-xl items-center mb-4"
              >
                <Text className="text-gray-700 font-semibold">Close</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}
