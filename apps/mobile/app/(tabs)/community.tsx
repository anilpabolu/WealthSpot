/**
 * Screen 12: Mobile Community Feed.
 * Posts list with categories and FAB for creating posts.
 */

import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useCommunityPosts, useLikePost } from '@/hooks/useCommunity'
import { formatRelativeTime } from '@/lib/formatters'

const CATEGORIES = ['All', 'Discussion', 'Questions', 'Polls', 'Announcements']

export default function CommunityScreen() {
  const [activeCategory, setActiveCategory] = useState('All')
  const category = activeCategory === 'All' ? undefined : activeCategory.toLowerCase()
  const { data, isLoading } = useCommunityPosts({ category })
  const likePost = useLikePost()

  const posts = data?.items ?? []

  return (
    <View className="flex-1 bg-surface">
      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white px-4 py-3"
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setActiveCategory(cat)}
            className={`mr-2 px-4 py-1.5 rounded-full ${
              activeCategory === cat ? 'bg-primary' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                activeCategory === cat ? 'text-white' : 'text-gray-600'
              }`}
            >
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
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
              <Ionicons name="chatbubbles-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-3 text-center">No posts yet</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const authorName = item.author?.fullName ?? 'Unknown'
          const initials = authorName
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              {/* Author */}
              <View className="flex-row items-center mb-2">
                <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center mr-2">
                  <Text className="text-primary text-xs font-bold">{initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold text-sm">{authorName}</Text>
                  <Text className="text-gray-400 text-[10px]">{formatRelativeTime(item.createdAt)}</Text>
                </View>
                <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                  <Text className="text-gray-500 text-[10px] font-semibold">{item.postType}</Text>
                </View>
              </View>

              {/* Content */}
              <Text className="text-gray-900 font-bold text-sm mb-1">{item.title}</Text>
              <Text className="text-gray-600 text-xs leading-4" numberOfLines={3}>{item.bodyPreview}</Text>

              {/* Actions */}
              <View className="flex-row items-center mt-3 pt-3 border-t border-gray-50">
                <Pressable
                  className="flex-row items-center mr-5"
                  onPress={() => likePost.mutate({ postId: item.id, currentlyLiked: item.userHasLiked })}
                >
                  <Ionicons name="arrow-up-outline" size={16} color="#5B4FCF" />
                  <Text className="text-primary text-xs font-semibold ml-1">{item.upvotes}</Text>
                </Pressable>
                <Pressable className="flex-row items-center mr-5">
                  <Ionicons name="chatbubble-outline" size={14} color="#9CA3AF" />
                  <Text className="text-gray-500 text-xs ml-1">{item.replyCount}</Text>
                </Pressable>
                <Pressable className="flex-row items-center">
                  <Ionicons name="share-outline" size={14} color="#9CA3AF" />
                  <Text className="text-gray-500 text-xs ml-1">Share</Text>
                </Pressable>
              </View>
            </View>
          )
        }}
      />

      {/* FAB */}
      <Pressable className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg">
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  )
}
