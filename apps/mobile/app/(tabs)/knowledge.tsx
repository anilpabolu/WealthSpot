import { useState } from 'react'
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useKnowledgeArticles, useKnowledgeArticle } from '@/hooks/useKnowledgeHub'

function ArticleModal({ slug, onClose }: { slug: string; onClose: () => void }) {
  const { data: article, isLoading } = useKnowledgeArticle(slug)

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-surface">
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Text className="font-bold text-lg text-gray-900" numberOfLines={1}>
            {article?.title || 'Loading...'}
          </Text>
          <Pressable onPress={onClose} className="p-1 rounded-full bg-gray-100">
            <Ionicons name="close" size={20} color="#6B7280" />
          </Pressable>
        </View>

        {isLoading || !article ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#5B4FCF" />
          </View>
        ) : (
          <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
            {article.coverImageUrl && (
              <Image source={{ uri: article.coverImageUrl }} className="w-full h-48 object-cover" />
            )}
            <View className="p-5">
              <Text className="font-bold text-2xl text-gray-900 mb-2">{article.title}</Text>
              <Text className="text-sm text-gray-500 mb-6">{article.synopsis}</Text>

              {article.body ? (
                <Text className="text-base text-gray-800 leading-6">{article.body}</Text>
              ) : null}

              {article.assets?.length > 0 && (
                <View className="mt-8">
                  <Text className="font-bold text-sm text-gray-900 mb-3">Attachments</Text>
                  {article.assets.map((asset) => (
                    <View key={asset.id} className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2">
                      <Ionicons
                        name={asset.assetType === 'pdf' ? 'document-text' : asset.assetType === 'video' ? 'play-circle' : 'image'}
                        size={24}
                        color="#5B4FCF"
                      />
                      <Text className="flex-1 text-sm font-medium text-gray-800" numberOfLines={1}>
                        {asset.filename || `Attachment (${asset.assetType})`}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  )
}

export default function KnowledgeHubScreen() {
  const { data: articles, isLoading } = useKnowledgeArticles()
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-5 pt-12 pb-4 bg-primary">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-1">
          WealthSpot Knowledge
        </Text>
        <Text className="font-bold text-2xl text-white">Knowledge Hub</Text>
        <Text className="text-white/70 text-sm mt-1">
          Curated insights, guides and research.
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#5B4FCF" />
        </View>
      ) : !articles || articles.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="book-outline" size={48} color="#D1D5DB" />
          <Text className="font-bold text-lg text-gray-900 mt-4 text-center">No articles yet</Text>
          <Text className="text-sm text-gray-500 text-center mt-1">Fresh insights are on the way — check back soon.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20 }} className="flex-1">
          {articles.map((article) => (
            <Pressable
              key={article.id}
              onPress={() => setActiveSlug(article.slug)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4"
            >
              {article.coverImageUrl ? (
                <Image source={{ uri: article.coverImageUrl }} className="w-full h-32 object-cover" />
              ) : (
                <View className="w-full h-32 bg-gray-100 items-center justify-center">
                  <Ionicons name="image-outline" size={32} color="#9CA3AF" />
                </View>
              )}
              <View className="p-4">
                <Text className="font-bold text-base text-gray-900 mb-1 line-clamp-2">
                  {article.title}
                </Text>
                <Text className="text-sm text-gray-500 line-clamp-3">
                  {article.synopsis}
                </Text>

                {(article.imageCount > 0 || article.pdfCount > 0) && (
                  <View className="flex-row items-center gap-2 mt-3">
                    {article.pdfCount > 0 && (
                      <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                        <Ionicons name="document-text-outline" size={12} color="#6B7280" />
                        <Text className="text-[10px] font-semibold text-gray-600">{article.pdfCount} PDF</Text>
                      </View>
                    )}
                    {article.imageCount > 0 && (
                      <View className="flex-row items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                        <Ionicons name="image-outline" size={12} color="#6B7280" />
                        <Text className="text-[10px] font-semibold text-gray-600">{article.imageCount} Image</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {activeSlug && <ArticleModal slug={activeSlug} onClose={() => setActiveSlug(null)} />}
    </View>
  )
}
