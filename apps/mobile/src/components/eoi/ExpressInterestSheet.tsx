/**
 * ExpressInterestSheet – Mobile bottom-sheet EOI flow.
 * Steps: config (BHK picker) → form (DB-driven options) → success
 */

import { useState } from 'react'
import {
  Modal, View, Text, Pressable, ScrollView,
  ActivityIndicator, TextInput, Switch,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  useBuilderQuestions, useSubmitEOI, useConnectWithBuilder, useEOIFormOptions,
  type BuilderQuestion,
} from '@/hooks/useEOI'

// ── Types ──────────────────────────────────────────────────────────────────

export type UnitCfg = {
  bhk_type?: string
  type?: string
  carpet_area_sqft?: number
  super_built_up_sqft?: number
  bathrooms?: number
  balconies?: number
  available_units?: number
  total_units?: number
  price_per_sqft?: number
}

export type PlotCfg = {
  type: string
  area_sqft?: number
  area_sqyd?: number
  area_guntha?: number
  total_plots?: number
  available_plots?: number
  price_per_sqft?: number
}

interface Props {
  visible: boolean
  onClose: () => void
  opportunityId: string
  opportunityTitle: string
  minInvestment: number
  investmentMode?: string
  unitConfigs?: UnitCfg[]
  plotConfigs?: PlotCfg[]
}

type Step = 'config' | 'form' | 'success'

// ── Helpers ───────────────────────────────────────────────────────────────

function getUnitLabel(cfg: UnitCfg): string {
  return cfg.bhk_type ?? cfg.type ?? 'Unit'
}

function computeUnitTotal(cfg: UnitCfg): number | null {
  if (cfg.carpet_area_sqft != null && cfg.price_per_sqft != null) {
    return cfg.carpet_area_sqft * cfg.price_per_sqft
  }
  return null
}

function formatLakhs(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`
  return `₹${(amount / 100_000).toFixed(2)} L`
}

// ── Chip multi-select ─────────────────────────────────────────────────────

function ChipGroup({
  options,
  selected,
  onChange,
  multi = true,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (vals: string[]) => void
  multi?: boolean
}) {
  const toggle = (v: string) => {
    if (multi) {
      onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])
    } else {
      onChange(selected[0] === v ? [] : [v])
    }
  }
  return (
    <View className="flex-row flex-wrap gap-2 mt-1.5">
      {options.map(o => {
        const isActive = selected.includes(o.value)
        return (
          <Pressable
            key={o.value}
            onPress={() => toggle(o.value)}
            className={`px-3 py-1.5 rounded-full border ${
              isActive ? 'bg-primary border-primary' : 'bg-white border-gray-200'
            }`}
          >
            <Text className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
              {o.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ── BHK Unit Config Card ──────────────────────────────────────────────────

function UnitCard({
  cfg,
  selected,
  onSelect,
}: {
  cfg: UnitCfg
  selected: boolean
  onSelect: () => void
}) {
  const total = computeUnitTotal(cfg)
  const label = getUnitLabel(cfg)

  return (
    <Pressable
      onPress={onSelect}
      className={`p-4 rounded-2xl border-2 mb-3 ${
        selected ? 'border-primary bg-purple-50' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`font-bold text-base ${selected ? 'text-primary' : 'text-gray-900'}`}>
          🏠 {label}
        </Text>
        {selected && (
          <View className="flex-row items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
            <Ionicons name="checkmark-circle" size={12} color="#5B4FCF" />
            <Text className="text-[10px] font-bold text-primary">Selected</Text>
          </View>
        )}
      </View>

      {/* Area specs */}
      <View className="flex-row gap-4 mb-2">
        {cfg.carpet_area_sqft != null && (
          <View>
            <Text className="text-[10px] text-gray-400 uppercase font-semibold">Carpet</Text>
            <Text className="text-xs font-semibold text-gray-800">
              {cfg.carpet_area_sqft.toLocaleString('en-IN')} sqft
            </Text>
          </View>
        )}
        {cfg.super_built_up_sqft != null && (
          <View>
            <Text className="text-[10px] text-gray-400 uppercase font-semibold">Super BUA</Text>
            <Text className="text-xs font-semibold text-gray-800">
              {cfg.super_built_up_sqft.toLocaleString('en-IN')} sqft
            </Text>
          </View>
        )}
      </View>

      {/* Amenities */}
      {(cfg.bathrooms != null || cfg.balconies != null || cfg.available_units != null || cfg.total_units != null) && (
        <View className="flex-row items-center gap-4 mb-2">
          {cfg.bathrooms != null && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="water-outline" size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-500">{cfg.bathrooms} Bath{cfg.bathrooms > 1 ? 's' : ''}</Text>
            </View>
          )}
          {cfg.balconies != null && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="home-outline" size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-500">{cfg.balconies} Balcon{cfg.balconies === 1 ? 'y' : 'ies'}</Text>
            </View>
          )}
          {(cfg.available_units ?? cfg.total_units) != null && (
            <Text className="text-xs text-gray-400 ml-auto">
              {cfg.available_units ?? cfg.total_units} units
            </Text>
          )}
        </View>
      )}

      {/* Price footer */}
      <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
        {cfg.price_per_sqft != null && (
          <Text className="text-xs text-gray-500">
            ₹{cfg.price_per_sqft.toLocaleString('en-IN')}/sqft
          </Text>
        )}
        {total != null && (
          <Text className={`text-sm font-bold ${selected ? 'text-primary' : 'text-green-600'}`}>
            {formatLakhs(total)}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

// ── Plot Config Card ──────────────────────────────────────────────────────

function PlotCard({
  cfg,
  selected,
  onSelect,
}: {
  cfg: PlotCfg
  selected: boolean
  onSelect: () => void
}) {
  const total =
    cfg.area_sqft != null && cfg.price_per_sqft != null ? cfg.area_sqft * cfg.price_per_sqft : null

  return (
    <Pressable
      onPress={onSelect}
      className={`p-4 rounded-2xl border-2 mb-3 ${
        selected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white'
      }`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <Text className={`font-bold text-base ${selected ? 'text-amber-700' : 'text-gray-900'}`}>
          🌿 {cfg.type}
        </Text>
        {selected && (
          <View className="flex-row items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-full">
            <Ionicons name="checkmark-circle" size={12} color="#B45309" />
            <Text className="text-[10px] font-bold text-amber-700">Selected</Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-4 mb-2">
        {cfg.area_sqft != null && (
          <View>
            <Text className="text-[10px] text-gray-400 uppercase font-semibold">Area (sqft)</Text>
            <Text className="text-xs font-semibold text-gray-800">{cfg.area_sqft.toLocaleString('en-IN')}</Text>
          </View>
        )}
        {cfg.area_sqyd != null && (
          <View>
            <Text className="text-[10px] text-gray-400 uppercase font-semibold">Area (sq.yd)</Text>
            <Text className="text-xs font-semibold text-gray-800">{cfg.area_sqyd.toLocaleString('en-IN')}</Text>
          </View>
        )}
        {(cfg.available_plots ?? cfg.total_plots) != null && (
          <View>
            <Text className="text-[10px] text-gray-400 uppercase font-semibold">Plots</Text>
            <Text className="text-xs font-semibold text-gray-800">{cfg.available_plots ?? cfg.total_plots}</Text>
          </View>
        )}
      </View>

      <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
        {cfg.price_per_sqft != null && (
          <Text className="text-xs text-gray-500">₹{cfg.price_per_sqft.toLocaleString('en-IN')}/sqft</Text>
        )}
        {total != null && (
          <Text className={`text-sm font-bold ${selected ? 'text-amber-700' : 'text-green-600'}`}>
            {formatLakhs(total)}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

// ── Field label ───────────────────────────────────────────────────────────

function FieldLabel({ text }: { text: string }) {
  return (
    <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">
      {text}
    </Text>
  )
}

// ── Main sheet ────────────────────────────────────────────────────────────

export default function ExpressInterestSheet({
  visible,
  onClose,
  opportunityId,
  opportunityTitle,
  minInvestment,
  investmentMode,
  unitConfigs = [],
  plotConfigs = [],
}: Props) {
  const hasConfigs = investmentMode !== 'lumpsum' && (unitConfigs.length > 0 || plotConfigs.length > 0)

  const [step, setStep] = useState<Step>(() => (hasConfigs ? 'config' : 'form'))
  const [eoiId, setEoiId] = useState<string | null>(null)
  const [selectedConfig, setSelectedConfig] = useState<UnitCfg | PlotCfg | null>(null)
  const [configError, setConfigError] = useState(false)

  // Form state
  const [timeline, setTimeline] = useState('')
  const [fundingSource, setFundingSource] = useState<string[]>([])
  const [purpose, setPurpose] = useState<string[]>([])
  const [preferredContact, setPreferredContact] = useState<string[]>([])
  const [bestTime, setBestTime] = useState('')
  const [notes, setNotes] = useState('')
  const [communicationConsent, setCommunicationConsent] = useState(true)
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})

  const { data: formOptions, isLoading: optionsLoading } = useEOIFormOptions()
  const { data: builderQuestions = [] } = useBuilderQuestions(opportunityId)
  const submitEOI = useSubmitEOI()
  const connectBuilder = useConnectWithBuilder()

  // Computed investment: from selected config or fallback
  const computedInvestment: number = (() => {
    if (selectedConfig && 'carpet_area_sqft' in selectedConfig) {
      const u = selectedConfig as UnitCfg
      if (u.carpet_area_sqft != null && u.price_per_sqft != null) {
        return u.carpet_area_sqft * u.price_per_sqft
      }
    }
    if (selectedConfig && 'area_sqft' in selectedConfig) {
      const p = selectedConfig as PlotCfg
      if (p.area_sqft != null && p.price_per_sqft != null) {
        return p.area_sqft * p.price_per_sqft
      }
    }
    return minInvestment
  })()

  const timelineOptions = (formOptions?.investment_timeline ?? []).map(o => ({ value: o.value, label: o.label }))
  const fundingOptions = (formOptions?.funding_source ?? []).map(o => ({ value: o.value, label: o.label }))
  const purposeOptions = (formOptions?.purpose ?? []).map(o => ({ value: o.value, label: o.label }))
  const contactOptions = (formOptions?.preferred_contact ?? []).map(o => ({ value: o.value, label: o.label }))

  const sortedUnits = [...unitConfigs].sort(
    (a, b) => (a.carpet_area_sqft ?? 0) - (b.carpet_area_sqft ?? 0)
  )

  const proceeedToForm = () => {
    if (hasConfigs && !selectedConfig) {
      setConfigError(true)
      return
    }
    setStep('form')
  }

  const handleSubmit = async () => {
    const answers = (builderQuestions as BuilderQuestion[])
      .filter(q => customAnswers[q.id]?.trim())
      .map(q => ({ questionId: q.id, answerText: customAnswers[q.id] ?? null }))

    const result = await submitEOI.mutateAsync({
      opportunityId,
      investmentAmount: computedInvestment || undefined,
      investmentTimeline: timeline || undefined,
      fundingSource: fundingSource.length ? fundingSource.join(',') : undefined,
      purpose: purpose.length ? purpose.join(',') : undefined,
      preferredContact: preferredContact.length ? preferredContact.join(',') : undefined,
      bestTimeToContact: bestTime || undefined,
      communicationConsent,
      additionalNotes: notes || undefined,
      selectedUnitConfig: selectedConfig ? (selectedConfig as Record<string, unknown>) : undefined,
      answers,
    })
    setEoiId(result.id)
    setStep('success')
  }

  const handleConnect = async () => {
    if (!eoiId) return
    await connectBuilder.mutateAsync(eoiId)
    onClose()
  }

  const resetAndClose = () => {
    setStep(hasConfigs ? 'config' : 'form')
    setSelectedConfig(null)
    setConfigError(false)
    setTimeline('')
    setFundingSource([])
    setPurpose([])
    setPreferredContact([])
    setBestTime('')
    setNotes('')
    setCommunicationConsent(true)
    setCustomAnswers({})
    setEoiId(null)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={resetAndClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[92%]">
          {/* Handle bar */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-gray-300" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
            <Text className="font-bold text-lg text-gray-900">
              {step === 'config'
                ? 'Choose Configuration'
                : step === 'form'
                ? 'Express Interest'
                : 'Interest Submitted!'}
            </Text>
            <Pressable
              onPress={resetAndClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <Ionicons name="close" size={18} color="#6B7280" />
            </Pressable>
          </View>

          {/* ── Config Step ── */}
          {step === 'config' && (
            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              <Text className="text-sm text-gray-500 mb-4">
                Select your preferred configuration for{' '}
                <Text className="font-semibold text-gray-900">{opportunityTitle}</Text>.
              </Text>

              {sortedUnits.length > 0 && (
                <>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider">
                    BHK / Unit Configurations
                  </Text>
                  {sortedUnits.map((u, i) => (
                    <UnitCard
                      key={i}
                      cfg={u}
                      selected={selectedConfig === u}
                      onSelect={() => { setSelectedConfig(u); setConfigError(false) }}
                    />
                  ))}
                </>
              )}

              {plotConfigs.length > 0 && (
                <>
                  <Text className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider mt-2">
                    Plot Configurations
                  </Text>
                  {plotConfigs.map((p, i) => (
                    <PlotCard
                      key={i}
                      cfg={p}
                      selected={selectedConfig === p}
                      onSelect={() => { setSelectedConfig(p); setConfigError(false) }}
                    />
                  ))}
                </>
              )}

              {configError && (
                <View className="flex-row items-center gap-1.5 mb-3">
                  <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                  <Text className="text-xs text-red-500 font-medium">Please select a configuration to continue.</Text>
                </View>
              )}

              <Pressable
                onPress={proceeedToForm}
                className="bg-primary py-4 rounded-2xl items-center mb-6"
              >
                <Text className="text-white font-bold text-base">Continue</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* ── Form Step ── */}
          {step === 'form' && (
            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              {/* Selected config banner */}
              {selectedConfig && (
                <View className="flex-row items-center gap-3 bg-purple-50 border border-primary/20 rounded-xl px-4 py-3 mb-4">
                  <Ionicons name="checkmark-circle" size={18} color="#5B4FCF" />
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-primary">
                      {'bhk_type' in selectedConfig || 'carpet_area_sqft' in selectedConfig
                        ? getUnitLabel(selectedConfig as UnitCfg)
                        : (selectedConfig as PlotCfg).type}
                    </Text>
                    {'carpet_area_sqft' in selectedConfig && (selectedConfig as UnitCfg).carpet_area_sqft != null && (
                      <Text className="text-xs text-gray-500">
                        {(selectedConfig as UnitCfg).carpet_area_sqft!.toLocaleString('en-IN')} sqft carpet
                      </Text>
                    )}
                  </View>
                  <Text className="text-sm font-bold text-primary">
                    {formatLakhs(computedInvestment)}
                  </Text>
                </View>
              )}

              {/* Investment amount (read-only) */}
              <View className="mb-4">
                <FieldLabel text="Investment Amount (₹)" />
                <View className="flex-row items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <Text className="font-mono text-gray-800 font-semibold">
                    {computedInvestment.toLocaleString('en-IN')}
                  </Text>
                  <Text className="text-xs font-bold text-primary">
                    {formatLakhs(computedInvestment)}
                  </Text>
                </View>
                <Text className="text-[11px] text-gray-400 mt-1">
                  {selectedConfig ? 'From selected configuration' : 'Minimum investment'}
                </Text>
              </View>

              {/* DB-driven form options */}
              {optionsLoading ? (
                <View className="flex-row items-center gap-2 py-4">
                  <ActivityIndicator size="small" color="#5B4FCF" />
                  <Text className="text-xs text-gray-400">Loading options…</Text>
                </View>
              ) : (
                <>
                  <View className="mb-4">
                    <FieldLabel text="Investment Timeline" />
                    <ChipGroup
                      options={timelineOptions}
                      selected={timeline ? [timeline] : []}
                      onChange={vals => setTimeline(vals[0] ?? '')}
                      multi={false}
                    />
                  </View>

                  <View className="mb-4">
                    <FieldLabel text="Funding Source" />
                    <ChipGroup options={fundingOptions} selected={fundingSource} onChange={setFundingSource} />
                  </View>

                  <View className="mb-4">
                    <FieldLabel text="Purpose" />
                    <ChipGroup options={purposeOptions} selected={purpose} onChange={setPurpose} />
                  </View>

                  <View className="mb-4">
                    <FieldLabel text="Preferred Contact Method" />
                    <ChipGroup options={contactOptions} selected={preferredContact} onChange={setPreferredContact} />
                  </View>
                </>
              )}

              {/* Best time */}
              <View className="mb-4">
                <FieldLabel text="Best Time to Contact" />
                <TextInput
                  value={bestTime}
                  onChangeText={setBestTime}
                  placeholder="e.g. Weekdays 10am–6pm"
                  placeholderTextColor="#9CA3AF"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800"
                />
              </View>

              {/* Builder custom questions */}
              {(builderQuestions as BuilderQuestion[]).length > 0 && (
                <View className="border-t border-gray-100 pt-4 mb-4">
                  <Text className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider">
                    Questions from Builder
                  </Text>
                  {(builderQuestions as BuilderQuestion[]).map(q => (
                    <View key={q.id} className="mb-4">
                      <Text className="text-sm font-medium text-gray-800 mb-1.5">
                        {q.questionText}
                        {q.isRequired && <Text className="text-red-500"> *</Text>}
                      </Text>
                      {q.questionType === 'boolean' ? (
                        <View className="flex-row gap-3">
                          {['Yes', 'No'].map(v => (
                            <Pressable
                              key={v}
                              onPress={() => setCustomAnswers(prev => ({ ...prev, [q.id]: v }))}
                              className={`px-5 py-2.5 rounded-xl border ${
                                customAnswers[q.id] === v
                                  ? 'bg-primary border-primary'
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <Text className={`text-sm font-medium ${customAnswers[q.id] === v ? 'text-white' : 'text-gray-700'}`}>
                                {v}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : (
                        <TextInput
                          value={customAnswers[q.id] ?? ''}
                          onChangeText={v => setCustomAnswers(prev => ({ ...prev, [q.id]: v }))}
                          placeholder="Your answer…"
                          placeholderTextColor="#9CA3AF"
                          keyboardType={q.questionType === 'number' ? 'numeric' : 'default'}
                          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800"
                        />
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Notes */}
              <View className="mb-4">
                <FieldLabel text="Additional Notes" />
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any questions or comments for the builder…"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800"
                  style={{ minHeight: 80 }}
                />
              </View>

              {/* Consent toggle */}
              <View className="flex-row items-center gap-3 mb-5">
                <Switch
                  value={communicationConsent}
                  onValueChange={setCommunicationConsent}
                  trackColor={{ false: '#D1D5DB', true: '#5B4FCF' }}
                  thumbColor="#FFFFFF"
                />
                <Text className="flex-1 text-xs text-gray-500">
                  I consent to receive communication regarding this opportunity.
                </Text>
              </View>

              {submitEOI.isError && (
                <View className="flex-row items-center gap-1.5 mb-3">
                  <Ionicons name="alert-circle-outline" size={14} color="#EF4444" />
                  <Text className="text-xs text-red-500">Something went wrong. Please try again.</Text>
                </View>
              )}

              <Pressable
                onPress={handleSubmit}
                disabled={submitEOI.isPending}
                className="bg-primary py-4 rounded-2xl items-center flex-row justify-center gap-2 mb-6"
              >
                {submitEOI.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="hand-right-outline" size={20} color="#FFFFFF" />
                )}
                <Text className="text-white font-bold text-base ml-2">Submit Expression of Interest</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* ── Success Step ── */}
          {step === 'success' && (
            <View className="px-5 py-8 items-center">
              <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-5">
                <Ionicons name="checkmark-circle" size={44} color="#16A34A" />
              </View>
              <Text className="font-bold text-xl text-gray-900 mb-2 text-center">
                Interest Submitted! 🎉
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
                Thank you for expressing interest in{' '}
                <Text className="font-semibold text-gray-800">{opportunityTitle}</Text>.
                The builder will be notified and may reach out to you.
              </Text>
              <Pressable
                onPress={handleConnect}
                disabled={connectBuilder.isPending}
                className="bg-primary w-full py-4 rounded-2xl items-center flex-row justify-center gap-2 mb-3"
              >
                {connectBuilder.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="chatbubble-outline" size={18} color="#FFFFFF" />
                )}
                <Text className="text-white font-bold text-base ml-2">Connect with Builder</Text>
              </Pressable>
              <Pressable
                onPress={resetAndClose}
                className="bg-gray-100 w-full py-4 rounded-2xl items-center"
              >
                <Text className="text-gray-700 font-semibold text-base">Close</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}
