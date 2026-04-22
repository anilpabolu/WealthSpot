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
import { useThemeStore } from '../../stores/theme.store'
import { getThemeColors } from '../../lib/theme'

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
  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  if (isLoading) {
    return (
      <View className="rounded-2xl p-5 items-center" style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF', borderWidth: 1, borderColor: isDark ? colors.borderSubtle : '#E5E7EB' }}>
        <ActivityIndicator color="#10b981" />
      </View>
    )
  }
  if (!data) return null

  return (
    <View className="rounded-2xl p-5" style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF', borderWidth: 1, borderColor: isDark ? colors.borderSubtle : '#E5E7EB' }}>
      <View className="flex-row items-center gap-2 mb-3">
        <ShieldCheck size={18} color={data.certified ? '#10b981' : '#94a3b8'} />
        <Text className="text-base font-bold" style={{ color: colors.textPrimary }}>
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
      <Text className="text-xs mb-3" style={{ color: colors.textSecondary }}>
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
            className="rounded-xl overflow-hidden mb-2"
            style={{ borderWidth: 1, borderColor: isDark ? colors.borderSubtle : '#E5E7EB' }}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                setOpenCats((s) => ({ ...s, [cat.code]: !open }))
              }
              className="flex-row items-center gap-3 px-4 py-3"
              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB' }}
            >
              <Icon size={16} color={isDark ? '#94a3b8' : '#475569'} />
              <View className="flex-1">
                <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                  {cat.name}
                </Text>
                <Text className="text-[11px]" style={{ color: colors.textSecondary }}>
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
                <SubItemRow key={sub.code} sub={sub} isDark={isDark} />
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
              <Text className="text-xs" style={{ color: colors.textPrimary }}>
                <Text className="font-semibold">{r.label}</Text>
                <Text style={{ color: colors.textSecondary }}> · severity {r.severity}</Text>
              </Text>
              {r.note && (
                <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>
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

function SubItemRow({ sub, isDark }: { sub: AssessmentSubItemRead; isDark: boolean }) {
  return (
    <View className="px-4 py-3" style={{ borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6' }}>
      <View className="flex-row items-center gap-2">
        <ShieldDot status={sub.status} size="sm" />
        <Text className="text-[13px] font-medium flex-1" style={{ color: isDark ? '#E2E8F0' : '#111827' }}>
          {sub.label}
        </Text>
        <Text className="text-[10px] uppercase tracking-wider" style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#6B7280' }}>
          {humanStatus(sub.status)}
        </Text>
      </View>
      {sub.reviewerNote && (
        <Text className="mt-1 text-[11px] italic" style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#4B5563' }}>
          Reviewer: {sub.reviewerNote}
        </Text>
      )}
      {sub.documents.length > 0 && (
        <View className="mt-2">
          {sub.documents.map((d) => (
            <View
              key={d.id}
              className="flex-row items-center gap-2 mt-1 px-2 py-1.5 rounded-lg"
              style={{ borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB' }}
            >
              {d.locked ? (
                <>
                  <Lock size={12} color="#f59e0b" />
                  <Text className="text-[11px] flex-1" style={{ color: isDark ? 'rgba(255,255,255,0.65)' : '#4B5563' }} numberOfLines={1}>
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
