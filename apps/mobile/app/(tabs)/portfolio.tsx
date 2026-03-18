/**
 * Screen 11: Mobile Portfolio Dashboard.
 * Summary metrics, asset allocation, holdings list.
 */

import { View, Text, ScrollView, Pressable } from 'react-native'
import { Link } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { formatINR } from '@/lib/formatters'

const PORTFOLIO = {
  totalInvested: 450000,
  currentValue: 512000,
  xirr: 13.8,
  monthlyIncome: 2700,
  properties: [
    {
      id: '1', name: 'Prestige Lakeside Habitat', city: 'Bengaluru',
      invested: 200000, value: 228000, irr: 14.5, units: 8,
    },
    {
      id: '2', name: 'Brigade Tech Park', city: 'Hyderabad',
      invested: 150000, value: 168000, irr: 16.2, units: 3,
    },
    {
      id: '3', name: 'Godrej Aqua Phase II', city: 'Pune',
      invested: 100000, value: 116000, irr: 13.8, units: 10,
    },
  ],
  allocation: [
    { type: 'Residential', pct: 67, color: '#5B4FCF' },
    { type: 'Commercial', pct: 33, color: '#FF6B35' },
  ],
}

export default function PortfolioScreen() {
  return (
    <ScrollView className="flex-1 bg-surface">
      {/* Summary Cards */}
      <View className="bg-primary px-4 pt-6 pb-8 rounded-b-3xl">
        <Text className="text-white/70 text-sm mb-2">Your Portfolio</Text>

        <View className="flex-row justify-between mb-4">
          <View>
            <Text className="text-white/60 text-xs">Total Invested</Text>
            <Text className="text-white font-bold text-xl">{formatINR(PORTFOLIO.totalInvested)}</Text>
          </View>
          <View className="items-end">
            <Text className="text-white/60 text-xs">Current Value</Text>
            <Text className="text-white font-bold text-xl">{formatINR(PORTFOLIO.currentValue)}</Text>
          </View>
        </View>

        <View className="flex-row bg-white/10 rounded-xl p-3 gap-4">
          <View className="flex-1 items-center">
            <Text className="text-white/60 text-[10px]">XIRR</Text>
            <Text className="text-emerald-300 font-bold text-base">{PORTFOLIO.xirr}%</Text>
          </View>
          <View className="w-px bg-white/20" />
          <View className="flex-1 items-center">
            <Text className="text-white/60 text-[10px]">Monthly Income</Text>
            <Text className="text-white font-bold text-base">{formatINR(PORTFOLIO.monthlyIncome)}</Text>
          </View>
          <View className="w-px bg-white/20" />
          <View className="flex-1 items-center">
            <Text className="text-white/60 text-[10px]">Properties</Text>
            <Text className="text-white font-bold text-base">{PORTFOLIO.properties.length}</Text>
          </View>
        </View>
      </View>

      {/* Asset Allocation */}
      <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <Text className="text-gray-900 font-bold text-base mb-3">Asset Allocation</Text>
        <View className="flex-row h-3 rounded-full overflow-hidden">
          {PORTFOLIO.allocation.map((a) => (
            <View
              key={a.type}
              style={{ width: `${a.pct}%`, backgroundColor: a.color }}
            />
          ))}
        </View>
        <View className="flex-row mt-3 gap-4">
          {PORTFOLIO.allocation.map((a) => (
            <View key={a.type} className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full mr-1.5" style={{ backgroundColor: a.color }} />
              <Text className="text-gray-600 text-xs">{a.type} ({a.pct}%)</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Holdings */}
      <View className="px-4 mt-4 mb-8">
        <Text className="text-gray-900 font-bold text-base mb-3">Your Holdings</Text>
        {PORTFOLIO.properties.map((prop) => (
          <Pressable key={prop.id} className="bg-white rounded-xl p-4 mb-2 shadow-sm">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-3">
                <Text className="text-gray-900 font-bold text-sm">{prop.name}</Text>
                <Text className="text-gray-400 text-xs">{prop.city} · {prop.units} units</Text>
              </View>
              <View className="items-end">
                <Text className="text-emerald-600 font-bold text-sm">{prop.irr}% IRR</Text>
              </View>
            </View>
            <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-50">
              <View>
                <Text className="text-gray-400 text-[10px]">Invested</Text>
                <Text className="text-gray-900 font-bold text-sm">{formatINR(prop.invested)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-400 text-[10px]">Current Value</Text>
                <Text className="text-emerald-600 font-bold text-sm">{formatINR(prop.value)}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  )
}
