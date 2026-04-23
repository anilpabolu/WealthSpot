import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useCreatePost } from '@/hooks/useCommunity'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'

const CATEGORIES = ['Discussion', 'Questions', 'Polls', 'Announcements']

export default function CreatePostScreen() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('Discussion')
  
  const createPost = useCreatePost()
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Validation Error', 'Title and content are required')
      return
    }
    
    try {
      await createPost.mutateAsync({
        title,
        body,
        category: category.toLowerCase(),
        tags: [],
        postType: 'discussion',
      })
      Alert.alert('Success', 'Post created successfully!')
      router.back()
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create post')
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-safe pb-4 border-b" style={{ borderBottomColor: isDark ? colors.borderDefault : '#F3F4F6', backgroundColor: colors.bgCard }}>
        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text className="font-bold text-lg" style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>Create Post</Text>
        <Pressable 
          onPress={handleSubmit} 
          disabled={createPost.isPending || !title || !body}
          className="px-4 py-2 rounded-full"
          style={{ backgroundColor: createPost.isPending || !title || !body ? (isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB') : (isDark ? colors.gold : '#5B4FCF') }}
        >
          {createPost.isPending ? (
            <ActivityIndicator size="small" color={isDark ? '#0c0a1f' : 'white'} />
          ) : (
            <Text className="font-bold" style={{ color: createPost.isPending || !title || !body ? colors.textTertiary : (isDark ? '#0c0a1f' : 'white') }}>Post</Text>
          )}
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        <Text className="font-bold mb-2 ml-1" style={{ color: colors.textSecondary }}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {CATEGORIES.map(cat => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              className="mr-2 px-4 py-2 rounded-full border"
              style={{
                backgroundColor: category === cat ? (isDark ? colors.gold : '#5B4FCF') : 'transparent',
                borderColor: category === cat ? (isDark ? colors.gold : '#5B4FCF') : (isDark ? colors.borderDefault : '#E5E7EB'),
              }}
            >
              <Text style={{ color: category === cat ? (isDark ? '#0c0a1f' : 'white') : colors.textSecondary, fontWeight: category === cat ? 'bold' : 'normal' }}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <TextInput
          placeholder="Post Title..."
          placeholderTextColor={colors.textTertiary}
          value={title}
          onChangeText={setTitle}
          className="text-xl font-bold py-2 outline-none mb-2"
          style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}
        />
        
        <TextInput
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textTertiary}
          value={body}
          onChangeText={setBody}
          multiline
          className="text-base py-2 outline-none"
          style={{ color: colors.textPrimary, minHeight: 200, textAlignVertical: 'top' }}
        />
      </ScrollView>
    </View>
  )
}
