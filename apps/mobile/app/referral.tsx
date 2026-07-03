/**
 * Referral Screen – mobile.
 * Shows the user's referral code, share options, stats, and history.
 */

import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Clipboard,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { formatINR } from '@/lib/formatters'
import { useReferralStats, useReferralHistory } from '@/hooks/useReferrals'
import { Badge, FadeInView } from '@/components/ui'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'

export default function ReferralScreen() {
  const { data: stats, isLoading: statsLoading } = useReferralStats()
  const { data: history, isLoading: histLoading } = useReferralHistory()
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  const referralCode = stats?.referralCode ?? '—'
  const referralLink = stats?.referralLink ?? `https://netegron.in/ref/${referralCode}`

  const handleCopy = (type: 'code' | 'link') => {
    const text = type === 'code' ? referralCode : referralLink
    Clipboard.setString(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Netegron and start investing in premium real estate! Use my referral code ${referralCode}: ${referralLink}`,
        url: referralLink,
        title: 'Invest with Netegron',
      })
    } catch {
      // user dismissed
    }
  }

  const totalReferred = stats?.totalReferrals ?? 0
  const investedCount = stats?.successfulReferrals ?? 0
  const totalEarned = stats?.totalRewards ?? 0

  const statCards = [
    {
      label: 'Referred',
      value: String(totalReferred),
      icon: 'people-outline' as const,
      accent: isDark ? '#60A5FA' : '#2563EB',
      bg: isDark ? 'rgba(96,165,250,0.1)' : '#EFF6FF',
    },
    {
      label: 'Invested',
      value: String(investedCount),
      icon: 'checkmark-circle-outline' as const,
      accent: isDark ? '#34D399' : '#059669',
      bg: isDark ? 'rgba(52,211,153,0.1)' : '#ECFDF5',
    },
    {
      label: 'Earned',
      value: totalEarned > 0 ? formatINR(totalEarned / 100) : '₹0',
      icon: 'cash-outline' as const,
      accent: isDark ? '#D4AF37' : '#5B4FCF',
      bg: isDark ? 'rgba(212,175,55,0.1)' : '#F5F3FF',
    },
  ]

  const steps = [
    { n: '1', title: 'Share Your Code', desc: 'Send your unique referral code to friends and family.' },
    { n: '2', title: 'Friend Signs Up', desc: 'They create an account using your referral link.' },
    { n: '3', title: 'Both Earn ₹250', desc: 'When they make their first investment, you both get rewarded.' },
  ]

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 pt-safe pb-4 border-b"
        style={{
          borderBottomColor: isDark ? colors.borderDefault : '#F3F4F6',
          backgroundColor: colors.bgCard,
        }}
      >
        <Pressable onPress={() => router.back()} className="p-2 -ml-2 mr-2">
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text
          className="font-bold text-lg"
          style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}
        >
          Refer &amp; Earn
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <FadeInView delay={0}>
          <View
            className="mx-4 mt-5 rounded-3xl p-5"
            style={{ backgroundColor: isDark ? '#0c0a1f' : '#1B2A4A' }}
          >
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="gift-outline" size={16} color={isDark ? '#D4AF37' : '#F59E0B'} />
              <Text className="text-xs font-bold uppercase tracking-wider" style={{ color: isDark ? '#D4AF37' : '#F59E0B' }}>
                Referral Program
              </Text>
            </View>
            <Text
              className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: 'BricolageGrotesque-Bold' }}
            >
              The Referral Hustle
            </Text>
            <Text className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Spread the word, stack the rewards. When your friend invests, you both pocket ₹250.
            </Text>

            {/* Referral code row */}
            {statsLoading ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.5)" />
            ) : (
              <>
                <Text className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Your Referral Code
                </Text>
                <View className="flex-row items-center gap-3 mb-4">
                  <Text
                    className="text-2xl font-bold tracking-widest"
                    style={{ color: isDark ? '#D4AF37' : '#F59E0B', fontFamily: 'FiraCode-Medium' }}
                  >
                    {referralCode}
                  </Text>
                  <Pressable
                    onPress={() => handleCopy('code')}
                    className="p-2 rounded-xl"
                    style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
                  >
                    <Ionicons
                      name={copied === 'code' ? 'checkmark' : 'copy-outline'}
                      size={18}
                      color={copied === 'code' ? '#34D399' : 'white'}
                    />
                  </Pressable>
                </View>

                {/* Link row */}
                <View
                  className="flex-row items-center rounded-xl px-3 py-2 mb-4"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                >
                  <Text
                    className="flex-1 text-xs"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {referralLink}
                  </Text>
                  <Pressable onPress={() => handleCopy('link')} className="ml-2 p-1">
                    <Ionicons
                      name={copied === 'link' ? 'checkmark' : 'copy-outline'}
                      size={16}
                      color={copied === 'link' ? '#34D399' : 'rgba(255,255,255,0.6)'}
                    />
                  </Pressable>
                </View>

                {/* Share button */}
                <Pressable
                  onPress={handleShare}
                  className="flex-row items-center justify-center gap-2 py-3 rounded-xl"
                  style={{ backgroundColor: isDark ? '#D4AF37' : '#5B4FCF' }}
                >
                  <Ionicons name="share-social-outline" size={18} color={isDark ? '#0c0a1f' : 'white'} />
                  <Text
                    className="font-bold text-sm"
                    style={{ color: isDark ? '#0c0a1f' : 'white', fontFamily: 'BricolageGrotesque-Bold' }}
                  >
                    Share Now
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </FadeInView>

        {/* Stats */}
        <FadeInView delay={80}>
          <View className="flex-row gap-3 mx-4 mt-4">
            {statCards.map((s) => (
              <View
                key={s.label}
                className="flex-1 rounded-2xl p-4 items-center"
                style={{
                  backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
                  borderWidth: isDark ? 1 : 0,
                  borderColor: colors.borderSubtle,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 1,
                }}
              >
                <View
                  className="w-10 h-10 rounded-xl items-center justify-center mb-2"
                  style={{ backgroundColor: s.bg }}
                >
                  <Ionicons name={s.icon} size={20} color={s.accent} />
                </View>
                <Text
                  className="font-bold text-lg"
                  style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}
                >
                  {s.value}
                </Text>
                <Text className="text-xs" style={{ color: colors.textTertiary }}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* How It Works */}
        <FadeInView delay={160}>
          <View
            className="mx-4 mt-4 rounded-3xl p-5"
            style={{
              backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.borderSubtle,
            }}
          >
            <Text
              className="font-bold text-base mb-4"
              style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}
            >
              How It Works
            </Text>
            {steps.map((s, i) => (
              <View key={s.n} className="flex-row items-start gap-3 mb-4">
                <View
                  className="w-7 h-7 rounded-full items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: isDark ? '#D4AF37' : '#5B4FCF' }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: isDark ? '#0c0a1f' : 'white' }}
                  >
                    {s.n}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="font-semibold text-sm mb-0.5"
                    style={{ color: colors.textPrimary }}
                  >
                    {s.title}
                  </Text>
                  <Text className="text-xs leading-5" style={{ color: colors.textSecondary }}>
                    {s.desc}
                  </Text>
                  {i < steps.length - 1 && (
                    <View
                      className="absolute left-[-19px] top-8 w-px h-5"
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }}
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
        </FadeInView>

        {/* Referral History */}
        <FadeInView delay={240}>
          <View
            className="mx-4 mt-4 mb-10 rounded-3xl overflow-hidden"
            style={{
              backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
              borderWidth: isDark ? 1 : 0,
              borderColor: colors.borderSubtle,
            }}
          >
            <View
              className="px-5 py-4 border-b"
              style={{ borderBottomColor: isDark ? colors.borderDefault : '#F3F4F6' }}
            >
              <Text
                className="font-bold text-base"
                style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}
              >
                Referral History
              </Text>
            </View>

            {histLoading && (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color={isDark ? colors.gold : '#5B4FCF'} />
              </View>
            )}

            {!histLoading && (!history || history.length === 0) && (
              <View className="py-10 items-center px-6">
                <Ionicons name="people-outline" size={40} color={isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB'} />
                <Text
                  className="font-bold text-sm mt-3 mb-1"
                  style={{ color: colors.textSecondary }}
                >
                  No Referrals Yet
                </Text>
                <Text className="text-xs text-center" style={{ color: colors.textTertiary }}>
                  Your referral scoreboard is empty — time to rally the squad!
                </Text>
              </View>
            )}

            {!histLoading &&
              history &&
              history.length > 0 &&
              history.map((ref, idx) => (
                <View
                  key={ref.id}
                  className="flex-row items-center px-5 py-4"
                  style={{
                    borderTopWidth: idx === 0 ? 0 : 1,
                    borderTopColor: isDark ? colors.borderDefault : '#F3F4F6',
                  }}
                >
                  {/* Avatar */}
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: isDark ? 'rgba(212,175,55,0.15)' : '#EEF2FF' }}
                  >
                    <Text
                      className="font-bold text-sm"
                      style={{ color: isDark ? '#D4AF37' : '#5B4FCF' }}
                    >
                      {(ref.refereeName[0] ?? '?').toUpperCase()}
                    </Text>
                  </View>

                  {/* Name + date */}
                  <View className="flex-1 min-w-0">
                    <Text
                      className="font-semibold text-sm"
                      style={{ color: colors.textPrimary }}
                      numberOfLines={1}
                    >
                      {ref.refereeName}
                    </Text>
                    <Text className="text-xs mt-0.5" style={{ color: colors.textTertiary }}>
                      {new Date(ref.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  {/* Status badge */}
                  <Badge
                    variant={ref.status === 'invested' ? 'success' : 'warning'}
                    size="sm"
                  >
                    {ref.status === 'invested' ? 'Invested' : 'Signed Up'}
                  </Badge>

                  {/* Reward */}
                  {ref.rewardAmount > 0 && (
                    <Text
                      className="font-bold text-sm ml-2"
                      style={{ color: isDark ? '#34D399' : '#059669' }}
                    >
                      +{formatINR(ref.rewardAmount / 100)}
                    </Text>
                  )}
                </View>
              ))}
          </View>
        </FadeInView>

      </ScrollView>
    </View>
  )
}
