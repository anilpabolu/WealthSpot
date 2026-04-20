import { useState } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { AlertTriangle, ChevronDown, ChevronRight, ShieldCheck, Lock } from 'lucide-react-native'
import {
  findCategory,
  humanStatus,
  iconForCategory,
  type AssessmentSubItemRead,
} from '../../lib/assessments'
import { useOpportunityAssessments } from '../../hooks/useShield'
import { ShieldDot } from './ShieldDot'

interface ShieldSectionProps {
  opportunityId: string
  mode?: 'public' | 'builder'
}

/**
 * Opportunity-detail Shield section for mobile — collapsible categories,
 * sub-item statuses, reviewer notes, EOI-gated evidence.
 */
export function ShieldSection({ opportunityId }: ShieldSectionProps) {
  const { data, isLoading } = useOpportunityAssessments(opportunityId)
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({})

  if (isLoading) {
    return (
      <View className="bg-white rounded-2xl border-2 border-gray-200 p-5 items-center">
        <ActivityIndicator color="#10b981" />
      </View>
    )
  }
  if (!data) return null

  return (
    <View className="bg-white rounded-2xl border-2 border-gray-200 p-5">
      <View className="flex-row items-center gap-2 mb-3">
        <ShieldCheck size={18} color={data.certified ? '#10b981' : '#94a3b8'} />
        <Text className="text-base font-bold text-gray-900">
          WealthSpot Shield
        </Text>
        {data.certified && (
          <View className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Certified
            </Text>
          </View>
        )}
      </View>
      <Text className="text-xs text-gray-500 mb-3">
        {data.passedCount} of {data.totalCount} checks passed across all 7 layers.
      </Text>

      {data.categories.map((catRead) => {
        const cat = findCategory(catRead.code)
        if (!cat) return null
        const Icon = iconForCategory(cat.icon)
        const open =
          openCats[cat.code] ?? catRead.status === 'flagged'
        return (
          <View
            key={cat.code}
            className="rounded-xl border border-gray-200 overflow-hidden mb-2"
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                setOpenCats((s) => ({ ...s, [cat.code]: !open }))
              }
              className="flex-row items-center gap-3 px-4 py-3 bg-gray-50"
            >
              <Icon size={16} color="#475569" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  {cat.name}
                </Text>
                <Text className="text-[11px] text-gray-500">
                  {catRead.passedCount}/{catRead.totalCount} passed ·{' '}
                  {humanStatus(catRead.status)}
                </Text>
              </View>
              <ShieldDot status={catRead.status} size="md" />
              {open ? (
                <ChevronDown size={16} color="#64748b" />
              ) : (
                <ChevronRight size={16} color="#64748b" />
              )}
            </TouchableOpacity>
            {open &&
              catRead.subItems.map((sub) => (
                <SubItemRow key={sub.code} sub={sub} />
              ))}
          </View>
        )
      })}

      {data.risks.length > 0 && (
        <View className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <View className="flex-row items-center gap-2 mb-1">
            <AlertTriangle size={14} color="#f59e0b" />
            <Text className="text-sm font-bold text-amber-700">
              Risks you should know
            </Text>
          </View>
          {data.risks.map((r) => (
            <View key={r.id} className="mt-1">
              <Text className="text-xs text-gray-900">
                <Text className="font-semibold">{r.label}</Text>
                <Text className="text-gray-500"> · severity {r.severity}</Text>
              </Text>
              {r.note && (
                <Text className="text-[11px] text-gray-600 mt-0.5">
                  {r.note}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

function SubItemRow({ sub }: { sub: AssessmentSubItemRead }) {
  return (
    <View className="px-4 py-3 border-t border-gray-100">
      <View className="flex-row items-center gap-2">
        <ShieldDot status={sub.status} size="sm" />
        <Text className="text-[13px] font-medium text-gray-900 flex-1">
          {sub.label}
        </Text>
        <Text className="text-[10px] uppercase tracking-wider text-gray-500">
          {humanStatus(sub.status)}
        </Text>
      </View>
      {sub.reviewerNote && (
        <Text className="mt-1 text-[11px] italic text-gray-600">
          Reviewer: {sub.reviewerNote}
        </Text>
      )}
      {sub.documents.length > 0 && (
        <View className="mt-2">
          {sub.documents.map((d) => (
            <View
              key={d.id}
              className="flex-row items-center gap-2 mt-1 px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50"
            >
              {d.locked ? (
                <>
                  <Lock size={12} color="#f59e0b" />
                  <Text className="text-[11px] text-gray-600 flex-1" numberOfLines={1}>
                    {d.filename ?? 'Document'}
                  </Text>
                  <Text className="text-[10px] text-amber-600 uppercase tracking-wider">
                    EOI required
                  </Text>
                </>
              ) : (
                <Text className="text-[11px] text-emerald-600 flex-1" numberOfLines={1}>
                  {d.filename ?? 'Document'}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
