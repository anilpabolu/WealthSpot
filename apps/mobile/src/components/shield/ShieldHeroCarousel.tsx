/**
 * Auto-rotating carousel that shows one Shield assessment layer at a time,
 * with an anime/cartoon SVG illustration, descriptions, and dot indicators.
 *
 * React Native port of the web ShieldHeroCarousel; uses react-native-reanimated
 * for spring-physics slide transitions instead of framer-motion.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, {
  FadeIn,
  SlideInRight,
  SlideOutLeft,
  Layout,
} from 'react-native-reanimated'
import { CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react-native'
import {
  ASSESSMENT_CATEGORIES,
  iconForCategory,
} from '../../lib/assessments'
import { illustrationForCategory } from './ShieldIllustrations'
import { ShieldInfoSheet } from './ShieldInfoSheet'

/** Tailwind accent class → hex */
const ACCENT_HEX: Record<string, string> = {
  'text-emerald-500': '#10b981',
  'text-sky-500': '#0ea5e9',
  'text-amber-500': '#f59e0b',
  'text-fuchsia-500': '#d946ef',
  'text-blue-500': '#3b82f6',
  'text-rose-500': '#f43f5e',
  'text-violet-500': '#8b5cf6',
}

function hexFor(accent: string): string {
  return ACCENT_HEX[accent] ?? '#6b7280'
}

const INTERVAL_MS = 5000

export function ShieldHeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)
  const pausedRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const advance = useCallback(() => {
    if (!pausedRef.current) {
      setActiveIndex((prev) => (prev + 1) % ASSESSMENT_CATEGORIES.length)
    }
  }, [])

  useEffect(() => {
    timerRef.current = setInterval(advance, INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [advance])

  const cat = ASSESSMENT_CATEGORIES[activeIndex]!
  const Icon = iconForCategory(cat.icon)
  const Illustration = illustrationForCategory(cat.code)
  const hex = hexFor(cat.accentColor)

  return (
    <Pressable
      onPressIn={() => {
        pausedRef.current = true
      }}
      onPressOut={() => {
        pausedRef.current = false
      }}
      className="w-full"
    >
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-1.5">
          <ShieldCheck size={14} color="#34d399" />
          <Text className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Shield Certified
          </Text>
        </View>
        <Pressable
          onPress={() => setSheetOpen(true)}
          className="flex-row items-center gap-0.5"
        >
          <Text className="text-[10px] text-white/50">Learn more</Text>
          <ChevronRight size={10} color="rgba(255,255,255,0.5)" />
        </Pressable>
      </View>

      {/* Carousel card */}
      <Animated.View
        key={cat.code}
        entering={SlideInRight.springify().stiffness(260).damping(26)}
        exiting={SlideOutLeft.springify().stiffness(260).damping(26)}
        layout={Layout.springify()}
      >
        <View className="flex-row gap-3 items-start">
          {/* Illustration */}
          <Animated.View entering={FadeIn.delay(150).duration(500)}>
            <Illustration size={90} />
          </Animated.View>

          {/* Text content */}
          <View className="flex-1">
            {/* Category icon + name */}
            <View className="flex-row items-center gap-2 mb-1.5">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: `${hex}20` }}
              >
                <Icon size={16} color={hex} />
              </View>
              <Text className="text-base font-bold text-white">
                {cat.name}
              </Text>
            </View>

            {/* Short def */}
            <Animated.Text
              entering={FadeIn.delay(180).duration(350)}
              className="text-xs font-semibold text-white/70 mb-1"
            >
              {cat.heroShortDef}
            </Animated.Text>

            {/* Full description */}
            <Animated.Text
              entering={FadeIn.delay(240).duration(350)}
              className="text-[11px] leading-4 text-white/50 mb-1.5"
              numberOfLines={3}
            >
              {cat.fullDescription}
            </Animated.Text>

            {/* Verified-by */}
            <Animated.Text
              entering={FadeIn.delay(300).duration(300)}
              className="text-[9px] uppercase tracking-wider text-white/30"
            >
              Verified by{' '}
              <Text className="text-white/50 font-semibold">
                {cat.performedBy === 'law_firm'
                  ? 'Empanelled Law Firm'
                  : cat.performedBy === 'sme'
                    ? 'Independent SME Panel'
                    : 'WealthSpot Team'}
              </Text>
            </Animated.Text>
          </View>
        </View>

        {/* Sub-item chips */}
        <Animated.View
          entering={FadeIn.delay(350).duration(350)}
          className="flex-row flex-wrap gap-1.5 mt-2.5"
        >
          {cat.subItems.slice(0, 4).map((s) => (
            <View
              key={s.code}
              className="flex-row items-center gap-1 px-2.5 py-1 rounded-full border border-white/10 bg-white/5"
            >
              <CheckCircle2 size={9} color={hex} />
              <Text className="text-[9px] font-medium text-white/60">
                {s.label}
              </Text>
            </View>
          ))}
        </Animated.View>
      </Animated.View>

      {/* Dot indicators */}
      <View className="flex-row items-center justify-center gap-1.5 mt-3">
        {ASSESSMENT_CATEGORIES.map((c, idx) => {
          const isActive = idx === activeIndex
          const dotHex = hexFor(c.accentColor)
          return (
            <Pressable
              key={c.code}
              onPress={() => setActiveIndex(idx)}
              style={{
                width: isActive ? 18 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: isActive ? dotHex : 'rgba(255,255,255,0.15)',
                ...(isActive && {
                  shadowColor: dotHex,
                  shadowOpacity: 0.6,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 4,
                }),
              }}
            />
          )
        })}
      </View>

      <ShieldInfoSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </Pressable>
  )
}
