/**
 * Screen 12: Mobile Community Feed.
 * Posts list with categories and FAB for creating posts.
 */

import { View, Text, ScrollView, Pressable, FlatList, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useCommunityPosts, useLikePost } from '@/hooks/useCommunity'
import { useProfilingProgress } from '@/hooks/useProfiling'
import { formatRelativeTime } from '@/lib/formatters'
import { EmptyState, Badge, FadeInView } from '@/components/ui'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'

const CATEGORIES = ['All', 'Discussion', 'Questions', 'Polls', 'Announcements']

export default function CommunityScreen() {
  const [activeCategory, setActiveCategory] = useState('All')
  const category = activeCategory === 'All' ? undefined : activeCategory.toLowerCase()
  const { data, isLoading } = useCommunityPosts({ category })
  const likePost = useLikePost()
  const { data: communityProgress } = useProfilingProgress('community')
  const profilingPct = communityProgress?.completionPct ?? 0

  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  const posts = data?.items ?? []

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Category Chips */}
      <FadeInView delay={0}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-3"
          style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' }}
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              className="mr-2 px-4 py-1.5 rounded-full"
              style={{
                backgroundColor: activeCategory === cat
                  ? (isDark ? colors.gold : '#5B4FCF')
                  : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{
                  color: activeCategory === cat
                    ? (isDark ? '#0c0a1f' : '#FFFFFF')
                    : (isDark ? colors.textSecondary : '#4B5563'),
                }}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FadeInView>

      {/* Posts List */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListHeaderComponent={
          <>
            {/* Profiling CTA */}
            {profilingPct < 100 && (
              <FadeInView delay={120}>
                <Pressable
                  onPress={() => router.push('/profiling?vault=community')}
                  className="rounded-3xl p-4 mb-4"
                  style={{
                    backgroundColor: isDark ? 'rgba(16,185,129,0.08)' : '#ECFDF5',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(16,185,129,0.2)' : '#A7F3D0',
                  }}
                >
                  <View className="flex-row items-center gap-3">
                    <Text className="text-2xl">🤝</Text>
                    <View className="flex-1">
                      <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>
                        {profilingPct > 0 ? 'Continue Community Profile' : 'Complete Your Profile'}
                      </Text>
                      <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
                        Find your perfect collaboration match
                      </Text>
                      <View className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5' }}>
                        <View
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(profilingPct, 100)}%`, backgroundColor: '#10B981' }}
                        />
                      </View>
                    </View>
                    <Ionicons name="arrow-forward" size={18} color="#10B981" />
                  </View>
                </Pressable>
              </FadeInView>
            )}
            {isLoading ? (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color={isDark ? colors.gold : '#5B4FCF'} />
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="chatbubbles-outline"
              title="No Posts Yet"
              message="Be the first to start a discussion in the community"
            />
          ) : null
        }
        renderItem={({ item, index }) => {
          const authorName = item.author?.fullName ?? 'Unknown'
          const initials = authorName
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

          return (
            <FadeInView delay={180 + index * 45}>
              <View
                className="rounded-3xl p-4"
                style={{
                  backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
                  borderWidth: isDark ? 1 : 0,
                  borderColor: colors.borderSubtle,
                  shadowColor: isDark ? '#D4AF37' : '#000',
                  shadowOpacity: isDark ? 0.04 : 0.06,
                  shadowRadius: isDark ? 10 : 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                {/* Author */}
                <View className="flex-row items-center mb-2">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: isDark ? 'rgba(91,79,207,0.2)' : '#EDE9FE' }}>
                    <Text className="text-xs font-bold" style={{ color: isDark ? '#A78BFA' : '#5B4FCF' }}>{initials}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-sm" style={{ color: colors.textPrimary }}>{authorName}</Text>
                    <Text className="text-[10px]" style={{ color: colors.textTertiary }}>{formatRelativeTime(item.createdAt)}</Text>
                  </View>
                  <Badge variant="neutral" size="xs">{item.postType}</Badge>
                </View>

                {/* Content */}
                <Text className="font-bold text-sm mb-1" style={{ color: colors.textPrimary }}>{item.title}</Text>
                <Text className="text-xs leading-4" numberOfLines={3} style={{ color: colors.textSecondary }}>{item.bodyPreview}</Text>

                {/* Actions */}
                <View className="flex-row items-center mt-3 pt-3" style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }}>
                  <Pressable
                    className="flex-row items-center mr-5"
                    onPress={() => likePost.mutate({ postId: item.id, currentlyLiked: item.userHasLiked })}
                  >
                    <Ionicons name="arrow-up-outline" size={16} color={isDark ? colors.gold : '#5B4FCF'} />
                    <Text className="text-xs font-semibold ml-1" style={{ color: isDark ? colors.gold : '#5B4FCF' }}>{item.upvotes}</Text>
                  </Pressable>
                  <Pressable className="flex-row items-center mr-5">
                    <Ionicons name="chatbubble-outline" size={14} color={colors.textTertiary} />
                    <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>{item.replyCount}</Text>
                  </Pressable>
                  <Pressable className="flex-row items-center">
                    <Ionicons name="share-outline" size={14} color={colors.textTertiary} />
                    <Text className="text-xs ml-1" style={{ color: colors.textSecondary }}>Share</Text>
                  </Pressable>
                </View>
              </View>
            </FadeInView>
          )
        }}
      />

      {/* FAB */}
      <FadeInView delay={220}>
        <Pressable
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full items-center justify-center"
          style={{
            backgroundColor: isDark ? colors.gold : '#5B4FCF',
            shadowColor: isDark ? '#D4AF37' : '#5B4FCF',
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 8,
          }}
        >
          <Ionicons name="add" size={28} color={isDark ? '#0c0a1f' : 'white'} />
        </Pressable>
      </FadeInView>
    </View>
  )
}
