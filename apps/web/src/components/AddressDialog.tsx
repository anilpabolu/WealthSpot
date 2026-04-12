import { useEffect, useState } from 'react'
import { Select } from '@/components/ui'
import { MapPin, Loader2 } from 'lucide-react'
import { usePincodeLookup } from '@/hooks/usePincodes'
import { INDIAN_CITIES } from '@/lib/constants'

export interface AddressFields {
  addressLine1: string
  addressLine2: string
  landmark: string
  locality: string
  city: string
  state: string
  pincode: string
  district: string
  country: string
}

interface Props {
  value: AddressFields
  onChange: (fields: AddressFields) => void
}

const EMPTY_ADDRESS: AddressFields = {
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  locality: '',
  city: '',
  state: '',
  pincode: '',
  district: '',
  country: 'India',
}

export default function AddressDialog({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState<AddressFields>(value.pincode ? value : EMPTY_ADDRESS)

  const { data: pincodeResults, isFetching } = usePincodeLookup(local.pincode)

  // Auto-fill from pincode lookup
  useEffect(() => {
    if (pincodeResults && pincodeResults.length > 0) {
      const first = pincodeResults[0]!
      setLocal((prev) => ({
        ...prev,
        locality: first.locality || prev.locality,
        district: first.district || prev.district,
        state: first.state || prev.state,
        city: first.district || prev.city,
      }))
    }
  }, [pincodeResults])

  const handleField = (field: keyof AddressFields, val: string) => {
    setLocal((prev) => ({ ...prev, [field]: val }))
  }

  const handleSave = () => {
    onChange(local)
    setOpen(false)
  }

  const hasAddress = value.addressLine1 || value.pincode || value.city

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Property Address
      </label>

      {/* Summary / trigger */}
      <button
        type="button"
        onClick={() => {
          setLocal(value.pincode ? value : EMPTY_ADDRESS)
          setOpen(true)
        }}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed text-left transition-all
          ${hasAddress ? 'border-primary/30 bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <MapPin className={`h-5 w-5 shrink-0 ${hasAddress ? 'text-primary' : 'text-gray-400'}`} />
        {hasAddress ? (
          <div className="text-sm">
            <p className="text-gray-900 font-medium">
              {[value.addressLine1, value.locality, value.city].filter(Boolean).join(', ')}
            </p>
            <p className="text-gray-500 text-xs">
              {[value.district, value.state, value.pincode].filter(Boolean).join(' · ')}
            </p>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Add complete address with pincode auto-fill</span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-5 py-3 flex items-center justify-between rounded-t-2xl">
              <h3 className="font-display font-bold text-gray-900">📍 Property Address</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 text-lg">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Pincode — hero input */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <div className="relative">
                  <input
                    value={local.pincode}
                    onChange={(e) => handleField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none pr-10"
                    placeholder="Enter 6-digit pincode"
                    maxLength={6}
                    inputMode="numeric"
                  />
                  {isFetching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                  )}
                </div>
                {pincodeResults && pincodeResults.length > 0 && pincodeResults[0] && (
                  <p className="text-xs text-emerald-600 mt-1">
                    ✓ {pincodeResults[0].officeName} — {pincodeResults[0].district}, {pincodeResults[0].state}
                  </p>
                )}
                {local.pincode.length === 6 && pincodeResults && pincodeResults.length === 0 && !isFetching && (
                  <p className="text-xs text-amber-600 mt-1">⚠ Not found — enter details manually</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  value={local.addressLine1}
                  onChange={(e) => handleField('addressLine1', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Plot/Survey no., Building name, Street"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  value={local.addressLine2}
                  onChange={(e) => handleField('addressLine2', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Floor, Wing, Sector"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                  <input
                    value={local.landmark}
                    onChange={(e) => handleField('landmark', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Near ..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Locality / Area</label>
                  <input
                    value={local.locality}
                    onChange={(e) => handleField('locality', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="e.g. Whitefield"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Select
                    value={local.city}
                    onChange={(v) => handleField('city', v)}
                    placeholder="Select city"
                    options={[
                      ...INDIAN_CITIES.map((c) => ({ value: c, label: c })),
                      ...(local.city && !(INDIAN_CITIES as readonly string[]).includes(local.city) ? [{ value: local.city, label: local.city }] : []),
                    ]}
                    searchable
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                  <input
                    value={local.district}
                    onChange={(e) => handleField('district', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Auto-filled from pincode"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    value={local.state}
                    onChange={(e) => handleField('state', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Auto-filled from pincode"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    value={local.country}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  />
                </div>
              </div>

              {/* Save */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors"
                >
                  Save Address
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
