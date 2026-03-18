/**
 * Screen 12: Mobile Community Feed.
 * Posts list with categories and FAB for creating posts.
 */

import { View, Text, ScrollView, Pressable, FlatList } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'

const CATEGORIES = ['All', 'Discussion', 'Questions', 'Polls', 'Announcements']

const POSTS = [
  {
    id: '1', author: 'Arun Mehta', avatar: 'AM',
    title: 'Best cities for fractional investment in 2025?',
    body: 'Looking at Bengaluru, Hyderabad and Pune. What are your thoughts on which city offers the best risk-adjusted returns currently?',
    category: 'Discussion', upvotes: 24, replies: 8, timeAgo: '2h ago',
  },
  {
    id: '2', author: 'Priya Sharma', avatar: 'PS',
    title: 'Understanding RERA compliance for fractional properties',
    body: 'Can someone explain how RERA applies to fractional ownership? Are all WealthSpot properties RERA registered?',
    category: 'Questions', upvotes: 31, replies: 12, timeAgo: '5h ago',
  },
  {
    id: '3', author: 'WealthSpot Team', avatar: 'WS',
    title: '🎉 New Feature: Secondary Market Trading',
    body: 'We are excited to announce that secondary market trading will be available from Q2 2025. You will be able to sell your fractions to other investors.',
    category: 'Announcements', upvotes: 89, replies: 34, timeAgo: '1d ago',
  },
  {
    id: '4', author: 'Rahul Gupta', avatar: 'RG',
    title: 'Monthly rental income vs capital appreciation – which strategy?',
    body: 'I have been investing for 6 months. Should I focus on properties with high rental yield or high IRR?',
    category: 'Discussion', upvotes: 15, replies: 6, timeAgo: '1d ago',
  },
]

export default function CommunityScreen() {
  const [activeCategory, setActiveCategory] = useState('All')

  const filtered = POSTS.filter(
    (p) => activeCategory === 'All' || p.category === activeCategory.slice(0, -1)
  )

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
        data={filtered}
        keyExtractor={(item: typeof filtered[number]) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }: { item: typeof filtered[number] }) => (
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            {/* Author */}
            <View className="flex-row items-center mb-2">
              <View className="w-8 h-8 rounded-full bg-primary-light items-center justify-center mr-2">
                <Text className="text-primary text-xs font-bold">{item.avatar}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-sm">{item.author}</Text>
                <Text className="text-gray-400 text-[10px]">{item.timeAgo}</Text>
              </View>
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-gray-500 text-[10px] font-semibold">{item.category}</Text>
              </View>
            </View>

            {/* Content */}
            <Text className="text-gray-900 font-bold text-sm mb-1">{item.title}</Text>
            <Text className="text-gray-600 text-xs leading-4" numberOfLines={3}>{item.body}</Text>

            {/* Actions */}
            <View className="flex-row items-center mt-3 pt-3 border-t border-gray-50">
              <Pressable className="flex-row items-center mr-5">
                <Ionicons name="arrow-up-outline" size={16} color="#5B4FCF" />
                <Text className="text-primary text-xs font-semibold ml-1">{item.upvotes}</Text>
              </Pressable>
              <Pressable className="flex-row items-center mr-5">
                <Ionicons name="chatbubble-outline" size={14} color="#9CA3AF" />
                <Text className="text-gray-500 text-xs ml-1">{item.replies}</Text>
              </Pressable>
              <Pressable className="flex-row items-center">
                <Ionicons name="share-outline" size={14} color="#9CA3AF" />
                <Text className="text-gray-500 text-xs ml-1">Share</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* FAB */}
      <Pressable className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg">
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </View>
  )
}
