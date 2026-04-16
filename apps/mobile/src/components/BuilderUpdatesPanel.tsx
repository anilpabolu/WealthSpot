/**
 * BuilderUpdatesPanel – read-only timeline of builder updates on property detail.
 * Tap an item to see full description + downloadable attachments in a bottom sheet.
 */

import { useState } from 'react'
import { View, Text, Pressable, Modal, ScrollView, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatRelativeTime } from '@/lib/formatters'
import { useBuilderUpdates } from '@/hooks/useBuilderUpdates'
import type { BuilderUpdate } from '@/hooks/useBuilderUpdates'

interface Props {
  opportunityId: string
}

export default function BuilderUpdatesPanel({ opportunityId }: Props) {
  const { data: updates = [] } = useBuilderUpdates(opportunityId)
  const [selected, setSelected] = useState<BuilderUpdate | null>(null)

  if (updates.length === 0) return null

  return (
    <View className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
      <Text className="text-gray-900 font-bold text-base mb-3">Builder Updates</Text>

      {updates.slice(0, 5).map((u) => (
        <Pressable
          key={u.id}
          onPress={() => setSelected(u)}
          className="flex-row items-start py-2.5 border-b border-gray-50"
        >
          <View className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-3" />
          <View className="flex-1 mr-2">
            <Text className="text-gray-900 text-sm font-semibold" numberOfLines={1}>
              {u.title}
            </Text>
            <Text className="text-gray-400 text-xs mt-0.5">
              {formatRelativeTime(u.createdAt)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            {u.attachments.length > 0 && (
              <Ionicons name="attach" size={14} color="#9CA3AF" />
            )}
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
          </View>
        </Pressable>
      ))}

      {/* Detail Bottom Sheet */}
      <Modal
        visible={!!selected}
        animationType="slide"
        transparent
        onRequestClose={() => setSelected(null)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <Pressable className="flex-1" onPress={() => setSelected(null)} />
          <View className="bg-white rounded-t-3xl max-h-[70%]">
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>
            <ScrollView className="px-5 pb-8" bounces={false}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-900 font-bold text-lg flex-1 mr-2">
                  {selected?.title}
                </Text>
                <Pressable onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={24} color="#9CA3AF" />
                </Pressable>
              </View>
              <Text className="text-gray-400 text-xs mb-4">
                {selected ? formatRelativeTime(selected.createdAt) : ''}
              </Text>
              {selected?.description ? (
                <Text className="text-gray-700 text-sm leading-5 mb-4">
                  {selected.description}
                </Text>
              ) : null}

              {(selected?.attachments ?? []).length > 0 && (
                <View className="mt-2">
                  <Text className="text-gray-500 text-xs font-semibold mb-2">ATTACHMENTS</Text>
                  {selected!.attachments.map((att) => (
                    <Pressable
                      key={att.id}
                      onPress={() => att.url && Linking.openURL(att.url)}
                      className="flex-row items-center bg-gray-50 rounded-xl px-3 py-2.5 mb-2"
                    >
                      <Ionicons name="document-outline" size={18} color="#5B4FCF" />
                      <Text className="text-gray-700 text-sm ml-2 flex-1" numberOfLines={1}>
                        {att.filename}
                      </Text>
                      <Ionicons name="download-outline" size={16} color="#5B4FCF" />
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}
