/**
 * Screen 15: Mobile Investment Flow (Modal).
 * Amount input → review → payment → confirmation.
 */

import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { formatINR } from '@/lib/formatters'
import { useInitiateInvestment, useConfirmPayment } from '@/hooks/useInvestment'
import { useProperty } from '@/hooks/useProperties'
import { Input } from '@/components/ui'

const STEPS = ['Amount', 'Review', 'Payment', 'Confirm']

export default function InvestScreen() {
  const { id } = useLocalSearchParams()
  const { data: property, isLoading: propertyLoading } = useProperty(id as string)
  const initiateMutation = useInitiateInvestment()
  const confirmMutation = useConfirmPayment()

  const [step, setStep] = useState(0)
  const [amount, setAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const unitPrice = property?.unitPrice ?? 25000
  const units = amount ? Math.floor(Number(amount) / unitPrice) : 0
  const totalAmount = units * unitPrice

  const handleNext = () => {
    if (step === 0 && units < 1) return
    if (step < 3) setStep(step + 1)
  }

  const handlePayment = async () => {
    if (!property) return
    setProcessing(true)
    try {
      const order = await initiateMutation.mutateAsync({
        propertyId: property.id,
        amount: totalAmount,
        units,
      })
      // In production, launch Razorpay SDK with order.razorpayOrderId / order.key
      // For now, auto-confirm (replace with real Razorpay integration)
      await confirmMutation.mutateAsync({
        orderId: order.orderId,
        razorpayPaymentId: `pay_${Date.now()}`,
        razorpaySignature: 'mock_signature',
      })
      setStep(3) // success
    } catch {
      // Payment failed - stay on payment step
    } finally {
      setProcessing(false)
    }
  }

  if (propertyLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#5B4FCF" />
      </View>
    )
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Progress Steps */}
      <View className="bg-white px-4 py-4">
        <View className="flex-row justify-between">
          {STEPS.map((label, i) => (
            <View key={label} className="items-center flex-1">
              <View className={`w-8 h-8 rounded-full items-center justify-center ${
                i <= step ? 'bg-primary' : 'bg-gray-200'
              }`}>
                {i < step ? (
                  <Ionicons name="checkmark" size={16} color="white" />
                ) : (
                  <Text className={`text-xs font-bold ${i <= step ? 'text-white' : 'text-gray-400'}`}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text className={`text-[10px] mt-1 ${i <= step ? 'text-primary font-semibold' : 'text-gray-400'}`}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Step 1: Amount */}
        {step === 0 && (
          <View>
            <View className="bg-white rounded-2xl p-5 shadow-sm">
              <Text className="text-gray-900 font-bold text-lg mb-1">Enter Investment Amount</Text>
              <Text className="text-gray-500 text-sm mb-4">
                Unit price: {formatINR(unitPrice)} per unit
              </Text>

              <Input
                icon={<Text className="text-gray-400 text-lg">₹</Text>}
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              {/* Quick amounts */}
              <View className="flex-row gap-2 mt-3">
                {[25000, 50000, 100000, 250000].map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setAmount(String(v))}
                    className="flex-1 bg-primary-light rounded-lg py-2 items-center"
                  >
                    <Text className="text-primary text-xs font-bold">{formatINR(v)}</Text>
                  </Pressable>
                ))}
              </View>

              {units > 0 && (
                <View className="mt-4 bg-gray-50 rounded-xl p-3">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500 text-sm">Units</Text>
                    <Text className="text-gray-900 font-bold">{units}</Text>
                  </View>
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-gray-500 text-sm">Total Amount</Text>
                    <Text className="text-primary font-bold">{formatINR(totalAmount)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Step 2: Review */}
        {step === 1 && (
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <Text className="text-gray-900 font-bold text-lg mb-4">Review Investment</Text>
            {[
              { label: 'Property', value: property?.title ?? 'Property' },
              { label: 'Units', value: String(units) },
              { label: 'Unit Price', value: formatINR(unitPrice) },
              { label: 'Total Amount', value: formatINR(totalAmount) },
              { label: 'Platform Fee (1%)', value: formatINR(totalAmount * 0.01) },
              { label: 'GST (18% on fee)', value: formatINR(totalAmount * 0.01 * 0.18) },
            ].map((row) => (
              <View key={row.label} className="flex-row justify-between py-2.5 border-b border-gray-50">
                <Text className="text-gray-500 text-sm">{row.label}</Text>
                <Text className="text-gray-900 font-semibold text-sm">{row.value}</Text>
              </View>
            ))}
            <View className="flex-row justify-between pt-3 mt-1">
              <Text className="text-gray-900 font-bold">Grand Total</Text>
              <Text className="text-primary font-bold text-lg">
                {formatINR(totalAmount + totalAmount * 0.01 + totalAmount * 0.01 * 0.18)}
              </Text>
            </View>
          </View>
        )}

        {/* Step 3: Payment */}
        {step === 2 && (
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <Text className="text-gray-900 font-bold text-lg mb-2">Choose Payment Method</Text>
            <Text className="text-gray-500 text-sm mb-4">Powered by Razorpay</Text>

            {['UPI', 'Net Banking', 'Debit Card', 'Credit Card'].map((method) => (
              <Pressable
                key={method}
                className="flex-row items-center py-3.5 border-b border-gray-50"
              >
                <View className="w-10 h-10 rounded-xl bg-primary-light items-center justify-center mr-3">
                  <Ionicons
                    name={
                      method === 'UPI' ? 'phone-portrait-outline' :
                      method === 'Net Banking' ? 'globe-outline' : 'card-outline'
                    }
                    size={18}
                    color="#5B4FCF"
                  />
                </View>
                <Text className="flex-1 text-gray-900 font-semibold">{method}</Text>
                <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 4: Confirmation */}
        {step === 3 && (
          <View className="items-center py-10">
            <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center mb-4">
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
            </View>
            <Text className="text-gray-900 font-bold text-xl mb-2">Investment Confirmed!</Text>
            <Text className="text-gray-500 text-center text-sm mb-6 px-8">
              You have successfully invested {formatINR(totalAmount)} in {property?.title ?? 'this property'}.
              {'\n\n'}You will receive rental income proportional to your {units} units.
            </Text>
            <Pressable
              onPress={() => router.replace('/portfolio')}
              className="bg-primary px-8 py-3 rounded-xl"
            >
              <Text className="text-white font-bold">View Portfolio</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      {step < 3 && (
        <View className="bg-white border-t border-gray-100 px-4 py-3">
          <Pressable
            onPress={step === 2 ? handlePayment : handleNext}
            disabled={processing || (step === 0 && units < 1)}
            className={`py-3.5 rounded-xl items-center ${
              processing || (step === 0 && units < 1) ? 'bg-gray-200' : 'bg-primary'
            }`}
          >
            <Text className={`font-bold text-base ${
              processing || (step === 0 && units < 1) ? 'text-gray-400' : 'text-white'
            }`}>
              {processing ? 'Processing...' : step === 2 ? `Pay ${formatINR(totalAmount)}` : 'Continue'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
