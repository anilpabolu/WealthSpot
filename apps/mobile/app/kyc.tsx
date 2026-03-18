/**
 * Screen 16: Mobile KYC Flow.
 * Step-by-step identity verification.
 */

import { View, Text, ScrollView, Pressable, TextInput } from 'react-native'
import { router } from 'expo-router'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { useUserStore } from '@/stores/user.store'

const STEPS = ['Personal', 'Documents', 'Selfie']

export default function KycScreen() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    fullName: '',
    panNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    pincode: '',
  })
  const [panUploaded, setPanUploaded] = useState(false)
  const [aadhaarUploaded, setAadhaarUploaded] = useState(false)
  const [selfieUploaded, setSelfieUploaded] = useState(false)
  const { updateKycStatus } = useUserStore()

  const handleNext = () => {
    if (step < 2) setStep(step + 1)
    else {
      // Submit KYC
      updateKycStatus('UNDER_REVIEW')
      router.back()
    }
  }

  const isStepValid = () => {
    if (step === 0) {
      return form.fullName && form.panNumber && form.dateOfBirth && form.address && form.city && form.pincode
    }
    if (step === 1) return panUploaded && aadhaarUploaded
    if (step === 2) return selfieUploaded
    return false
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Step Indicator */}
      <View className="bg-white px-4 py-4 flex-row justify-between">
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

      <ScrollView className="flex-1 px-4 pt-4">
        {/* Step 1: Personal Details */}
        {step === 0 && (
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <Text className="text-gray-900 font-bold text-lg mb-4">Personal Details</Text>

            {[
              { key: 'fullName' as const, label: 'Full Name (as per PAN)', placeholder: 'Enter full name' },
              { key: 'panNumber' as const, label: 'PAN Number', placeholder: 'ABCDE1234F' },
              { key: 'dateOfBirth' as const, label: 'Date of Birth', placeholder: 'DD/MM/YYYY' },
              { key: 'address' as const, label: 'Address', placeholder: 'Full address' },
              { key: 'city' as const, label: 'City', placeholder: 'City name' },
              { key: 'pincode' as const, label: 'Pincode', placeholder: '6-digit pincode' },
            ].map((field) => (
              <View key={field.key} className="mb-3">
                <Text className="text-gray-600 text-sm font-medium mb-1">{field.label}</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-900"
                  placeholder={field.placeholder}
                  placeholderTextColor="#9CA3AF"
                  value={form[field.key]}
                  onChangeText={(v: string) => setForm({ ...form, [field.key]: v })}
                  autoCapitalize={field.key === 'panNumber' ? 'characters' : 'words'}
                  keyboardType={field.key === 'pincode' ? 'numeric' : 'default'}
                />
              </View>
            ))}
          </View>
        )}

        {/* Step 2: Document Upload */}
        {step === 1 && (
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <Text className="text-gray-900 font-bold text-lg mb-4">Upload Documents</Text>

            {[
              { label: 'PAN Card', uploaded: panUploaded, onUpload: () => setPanUploaded(true) },
              { label: 'Aadhaar Card', uploaded: aadhaarUploaded, onUpload: () => setAadhaarUploaded(true) },
            ].map((doc) => (
              <Pressable
                key={doc.label}
                onPress={doc.onUpload}
                className={`border-2 border-dashed rounded-xl p-6 items-center mb-3 ${
                  doc.uploaded ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200'
                }`}
              >
                <Ionicons
                  name={doc.uploaded ? 'checkmark-circle' : 'cloud-upload-outline'}
                  size={32}
                  color={doc.uploaded ? '#059669' : '#9CA3AF'}
                />
                <Text className={`mt-2 font-semibold ${doc.uploaded ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {doc.uploaded ? `${doc.label} Uploaded` : `Upload ${doc.label}`}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {doc.uploaded ? 'Tap to replace' : 'JPG, PNG or PDF (max 5MB)'}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 3: Selfie */}
        {step === 2 && (
          <View className="bg-white rounded-2xl p-5 shadow-sm items-center">
            <Text className="text-gray-900 font-bold text-lg mb-2">Selfie Verification</Text>
            <Text className="text-gray-500 text-sm text-center mb-6">
              Take a selfie to verify your identity. Ensure good lighting and face the camera directly.
            </Text>

            <Pressable
              onPress={() => setSelfieUploaded(true)}
              className={`w-40 h-40 rounded-full items-center justify-center ${
                selfieUploaded ? 'bg-emerald-50' : 'bg-gray-50 border-2 border-dashed border-gray-200'
              }`}
            >
              <Ionicons
                name={selfieUploaded ? 'checkmark-circle' : 'camera-outline'}
                size={48}
                color={selfieUploaded ? '#059669' : '#9CA3AF'}
              />
              <Text className={`mt-2 text-sm font-semibold ${selfieUploaded ? 'text-emerald-700' : 'text-gray-400'}`}>
                {selfieUploaded ? 'Captured' : 'Take Selfie'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <View className="bg-white border-t border-gray-100 px-4 py-3 flex-row gap-3">
        {step > 0 && (
          <Pressable
            onPress={() => setStep(step - 1)}
            className="flex-1 py-3.5 rounded-xl items-center border border-gray-200"
          >
            <Text className="text-gray-700 font-bold">Back</Text>
          </Pressable>
        )}
        <Pressable
          onPress={handleNext}
          disabled={!isStepValid()}
          className={`flex-1 py-3.5 rounded-xl items-center ${
            isStepValid() ? 'bg-primary' : 'bg-gray-200'
          }`}
        >
          <Text className={`font-bold ${isStepValid() ? 'text-white' : 'text-gray-400'}`}>
            {step === 2 ? 'Submit KYC' : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
