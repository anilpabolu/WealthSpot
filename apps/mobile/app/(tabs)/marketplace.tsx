/**
 * Screen 10: Mobile Marketplace.
 * Grid of properties with search & filter chips.
 */

import { View, Text, ScrollView, Pressable, Image, FlatList, ActivityIndicator } from 'react-native'
import { Link, useLocalSearchParams } from 'expo-router'
import { useState, useMemo } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { formatINR } from '@/lib/formatters'
import { useProperties } from '@/hooks/useProperties'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useVaultConfig } from '@/hooks/useVaultConfig'
import { EmptyState, Badge, Input, FadeInView } from '@/components/ui'
import { ShieldHeroCarousel } from '@/components/shield/ShieldHeroCarousel'
import { useThemeStore } from '@/stores/theme.store'
import { getThemeColors } from '@/lib/theme'

/* Vault-specific gradient + branding config */
const VAULT_HERO_CONFIG: Record<
  string,
  {
    badge: string
    gradientColors: [string, string, string]
    accentDot: string
    accentText: string
    defaultTitle: string
    defaultSubtitle: string
    shieldNote: string
  }
> = {
  wealth: {
    badge: 'Wealth Vault',
    gradientColors: ['#0f172a', '#1a1a3e', '#0f172a'],
    accentDot: '#34d399',
    accentText: '#34d399',
    defaultTitle: 'Invest Smarter',
    defaultSubtitle: 'Transparent, secure, Shield-verified opportunities.',
    shieldNote: 'Every listing is independently verified across 7 assessment layers.',
  },
  safe: {
    badge: 'Safe Vault',
    gradientColors: ['#042F2E', '#0F766E', '#042F2E'],
    accentDot: '#5EEAD4',
    accentText: '#5EEAD4',
    defaultTitle: 'Safe Vault',
    defaultSubtitle: 'Fixed returns backed by real estate & mortgage agreements.',
    shieldNote: 'Every listing is independently verified across 7 assessment layers.',
  },
  community: {
    badge: 'Community Vault',
    gradientColors: ['#2E1A06', '#4A2A0A', '#2E1A06'],
    accentDot: '#F59E0B',
    accentText: '#F59E0B',
    defaultTitle: 'Invest Together',
    defaultSubtitle: 'Collaborate with like-minded investors.',
    shieldNote: 'Every listing is independently verified across 7 assessment layers.',
  },
}

const FILTER_CHIPS = ['All', 'Residential', 'Commercial', 'Warehousing', 'Plotted']
const COMMUNITY_SUBTYPE_CHIPS = [
  { value: '', label: 'All' },
  { value: 'co_investor', label: 'Co-Investor' },
  { value: 'co_partner', label: 'Co-Partner' },
] as const

export default function MarketplaceScreen() {
  const { vault, subtype } = useLocalSearchParams<{ vault?: string; subtype?: string }>()
  const vaultKey = (vault && vault in VAULT_HERO_CONFIG ? vault : 'wealth') as keyof typeof VAULT_HERO_CONFIG
  const hero = VAULT_HERO_CONFIG[vaultKey]
  const isCommunityVault = vault === 'community'
  const { filters, setFilter, resetFilters } = useMarketplaceStore()
  const { isVaultEnabled } = useVaultConfig()
  const isVaultDisabled = vault ? !isVaultEnabled(vault) : false
  const [search, setSearch] = useState(filters.search ?? '')
  const [activeFilter, setActiveFilter] = useState(filters.assetType ?? 'All')
  const [communitySubtype, setCommunitySubtype] = useState(subtype ?? '')

  const resolved = useThemeStore((s) => s.resolved)
  const isDark = resolved === 'dark'
  const colors = getThemeColors(isDark)

  const queryFilters = useMemo(
    () => ({
      ...filters,
      search: search || '',
      assetType: activeFilter !== 'All' ? activeFilter : '',
    }),
    [search, activeFilter, filters],
  )

  const { data, isLoading } = useProperties(queryFilters)
  const properties = data?.properties ?? []

  const handleFilterChip = (chip: string) => {
    setActiveFilter(chip)
    setFilter('assetType', chip !== 'All' ? chip : '')
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      {isVaultDisabled ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-4xl mb-3">🔒</Text>
          <Text className="text-lg font-bold text-center mb-2" style={{ color: colors.textPrimary }}>
            {vault === 'community' ? 'Rallying the Tribe...' : 'Safe Vault is Being Secured...'}
          </Text>
          <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
            {vault === 'community'
              ? 'Community Vault is coming soon. We\'re building something special for collaborative investing.'
              : 'Safe Vault is coming soon. Fixed-return, mortgage-backed opportunities are being lined up.'}
          </Text>
        </View>
      ) : (
      <>
      {/* Search Bar */}
      <FadeInView delay={0}>
        <View className="px-4 pt-4 pb-2" style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' }}>
          <View className="flex-row items-center rounded-xl px-4 py-2.5" style={{ backgroundColor: isDark ? colors.bgInput : '#F3F4F6' }}>
            <Ionicons name="search-outline" size={18} color={isDark ? colors.textTertiary : '#9CA3AF'} />
            <Input
              className="flex-1 ml-2"
              placeholder="Search properties, cities..."
              value={search}
              onChangeText={setSearch}
              size="sm"
            />
            {search ? (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={isDark ? colors.textTertiary : '#9CA3AF'} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </FadeInView>

      {/* Filter Chips */}
      <FadeInView delay={80}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 pb-3"
          style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' }}
        >
          {FILTER_CHIPS.map((chip) => (
            <Pressable
              key={chip}
              onPress={() => handleFilterChip(chip)}
              className="mr-2 px-4 py-1.5 rounded-full"
              style={{
                backgroundColor: activeFilter === chip
                  ? (isDark ? colors.gold : '#5B4FCF')
                  : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
              }}
            >
              <Text
                className="text-sm font-semibold"
                style={{
                  color: activeFilter === chip
                    ? (isDark ? '#0c0a1f' : '#FFFFFF')
                    : (isDark ? colors.textSecondary : '#4B5563'),
                }}
              >
                {chip}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FadeInView>

      {/* Community Subtype Chips */}
      {isCommunityVault && (
        <FadeInView delay={120}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 pb-3"
            style={{ backgroundColor: isDark ? colors.bgSurface : '#FFFFFF' }}
          >
            <View className="flex-row items-center">
              <Text className="text-[10px] font-bold uppercase tracking-wider mr-2" style={{ color: colors.textTertiary }}>Type:</Text>
              {COMMUNITY_SUBTYPE_CHIPS.map((chip) => (
                <Pressable
                  key={chip.value}
                  onPress={() => setCommunitySubtype(chip.value)}
                  className="mr-2 px-4 py-1.5 rounded-full"
                  style={{
                    backgroundColor: communitySubtype === chip.value
                      ? '#059669'
                      : (isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6'),
                  }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{
                      color: communitySubtype === chip.value
                        ? '#FFFFFF'
                        : (isDark ? colors.textSecondary : '#4B5563'),
                    }}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </FadeInView>
      )}

      {/* Property Grid */}
      <FlatList
        data={properties}
        numColumns={2}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        columnWrapperStyle={{ gap: 16 }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        ListHeaderComponent={
          <View>
            {/* Vault-aware hero with gradient + carousel */}
            <FadeInView delay={180}>
              <LinearGradient
                colors={hero.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="rounded-2xl px-4 py-5 mb-4 -mx-1"
              >
              {/* Badge */}
              <View className="flex-row items-center gap-1.5 mb-2">
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: hero.accentDot }}
                />
                <Text className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  {hero.badge}
                </Text>
              </View>

              {/* Title & subtitle */}
              <Text className="text-lg font-bold text-white mb-0.5">
                {hero.defaultTitle}
              </Text>
              <Text className="text-xs text-white/60 mb-3">
                {hero.defaultSubtitle}
              </Text>

              {/* Shield note */}
              <Text className="text-[10px] text-white/40 mb-3">
                {hero.shieldNote}{' '}
                <Text style={{ color: hero.accentText }} className="font-semibold">
                  Shield Certified
                </Text>
              </Text>

              {/* Carousel */}
                <ShieldHeroCarousel />
              </LinearGradient>
            </FadeInView>

            {isLoading ? (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color={isDark ? colors.gold : '#5B4FCF'} />
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="search-outline"
              title="No Properties Found"
              message="Try adjusting your search or filters"
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <FadeInView delay={220 + index * 40}>
            <Link href={`/property/${item.slug}`} asChild>
              <Pressable
                className="flex-1 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: isDark ? colors.bgSurface : '#FFFFFF',
                  borderWidth: isDark ? 1 : 0,
                  borderColor: colors.cardBorder,
                  shadowColor: isDark ? '#D4AF37' : '#000',
                  shadowOpacity: isDark ? 0.05 : 0.06,
                  shadowRadius: isDark ? 10 : 4,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                }}
              >
                {item.coverImage ? (
                  <Image
                    source={{ uri: item.coverImage }}
                    className="w-full h-28"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-28 items-center justify-center" style={{ backgroundColor: isDark ? colors.bgCard : '#E5E7EB' }}>
                    <Ionicons name="image-outline" size={24} color={isDark ? colors.textTertiary : '#9CA3AF'} />
                  </View>
                )}
                <View className="absolute top-2 left-2">
                  <Badge variant="purple" size="xs">{item.assetType}</Badge>
                </View>
                <View className="p-3">
                  <Text className="font-bold text-xs" numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: 'BricolageGrotesque-Bold' }}>
                    {item.title}
                  </Text>
                  <Text className="text-[10px]" style={{ color: colors.textTertiary }}>{item.city}</Text>
                  <View className="flex-row mt-2 gap-3">
                    <View>
                      <Text className="text-[9px]" style={{ color: colors.textTertiary }}>IRR</Text>
                      <Text className="font-bold text-xs" style={{ color: '#10B981' }}>{item.targetIrr}%</Text>
                    </View>
                    <View>
                      <Text className="text-[9px]" style={{ color: colors.textTertiary }}>Min</Text>
                      <Text className="font-bold text-xs" style={{ color: colors.textPrimary }}>{formatINR(item.minInvestment)}</Text>
                    </View>
                  </View>
                  <View className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F3F4F6' }}>
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${item.fundingPercentage}%`, backgroundColor: isDark ? colors.gold : '#5B4FCF' }}
                    />
                  </View>
                </View>
              </Pressable>
            </Link>
          </FadeInView>
        )}
      />
      </>
      )}
    </View>
  )
}
