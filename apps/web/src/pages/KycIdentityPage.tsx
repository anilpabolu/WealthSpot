import { MainLayout } from '@/components/layout'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { panSchema } from '@/lib/validators'
import {
  useSubmitKycDetails,
  useUploadKycDocument,
  useSubmitKycForReview,
} from '@/hooks/useKycBank'
import {
  Upload, CheckCircle2, ArrowRight, ArrowLeft,
  User, FileText, Camera, Lock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const kycSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  panNumber: panSchema,
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  address: z.string().min(10, 'Full address is required'),
  city: z.string().min(1, 'City is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
})

type KycFormData = z.infer<typeof kycSchema>

const STEPS = [
  { num: 1, label: 'Personal Details', icon: User },
  { num: 2, label: 'Document Upload', icon: FileText },
  { num: 3, label: 'Selfie Verification', icon: Camera },
]

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
              currentStep > step.num
                ? 'bg-success text-white'
                : currentStep === step.num
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-400'
            )}
          >
            {currentStep > step.num ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              step.num
            )}
          </div>
          <span
            className={cn(
              'text-sm font-medium hidden sm:block',
              currentStep >= step.num ? 'text-gray-900' : 'text-gray-400'
            )}
          >
            {step.label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'w-8 h-0.5 mx-2',
              currentStep > step.num ? 'bg-success' : 'bg-gray-200'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function KycIdentityPage() {
  const [step, setStep] = useState(1)
  const [panFile, setPanFile] = useState<File | null>(null)
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  const submitDetails = useSubmitKycDetails()
  const uploadDoc = useUploadKycDocument()
  const submitForReview = useSubmitKycForReview()

  const {
    register,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<KycFormData>({
    resolver: zodResolver(kycSchema),
  })

  const handleStep1Next = async () => {
    const valid = await trigger(['fullName', 'panNumber', 'dateOfBirth', 'address', 'city', 'pincode'])
    if (!valid) return

    try {
      await submitDetails.mutateAsync(getValues())
      setStep(2)
    } catch {
      // Error handled by mutation
    }
  }

  const handleStep2Next = () => {
    if (!panFile || !aadhaarFile) return
    setStep(3)
  }

  const handleFinalSubmit = async () => {
    if (!selfieFile || !panFile || !aadhaarFile) return
    setSubmitting(true)

    try {
      // Upload all documents
      setUploadProgress('Uploading PAN card…')
      await uploadDoc.mutateAsync({ documentType: 'PAN', file: panFile })

      setUploadProgress('Uploading Aadhaar card…')
      await uploadDoc.mutateAsync({ documentType: 'AADHAAR', file: aadhaarFile })

      setUploadProgress('Uploading selfie…')
      await uploadDoc.mutateAsync({ documentType: 'SELFIE', file: selfieFile })

      setUploadProgress('Submitting for review…')
      await submitForReview.mutateAsync()

      setStep(4) // success
    } catch {
      setUploadProgress('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <MainLayout>
      {/* Hero */}
      <section className="page-hero bg-gradient-to-br from-[#1B2A4A] via-[#2D3F5E] to-[#1B2A4A]">
        <div className="page-hero-content">
          <span className="page-hero-badge">KYC</span>
          <h1 className="page-hero-title">Identity Verification</h1>
          <p className="page-hero-subtitle">Complete KYC to start investing — takes only 5 minutes</p>
        </div>
      </section>

      <div className="page-section">
        <div className="page-section-container max-w-2xl mx-auto">

        {step <= 3 && <StepIndicator currentStep={step} />}

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <div className="card p-6 space-y-5">
            <h2 className="section-title text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name (as per PAN)</label>
                <input
                  {...register('fullName')}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="Enter your full name"
                />
                {errors.fullName && <p className="text-xs text-danger mt-1">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">PAN Number</label>
                <input
                  {...register('panNumber')}
                  className="w-full px-3 py-2.5 text-sm font-mono uppercase border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
                {errors.panNumber && <p className="text-xs text-danger mt-1">{errors.panNumber.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Date of Birth</label>
                <input
                  type="date"
                  {...register('dateOfBirth')}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                {errors.dateOfBirth && <p className="text-xs text-danger mt-1">{errors.dateOfBirth.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Full Address</label>
                <textarea
                  {...register('address')}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="House no., Street, Area"
                />
                {errors.address && <p className="text-xs text-danger mt-1">{errors.address.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
                  <input
                    {...register('city')}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="City"
                  />
                  {errors.city && <p className="text-xs text-danger mt-1">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Pincode</label>
                  <input
                    {...register('pincode')}
                    className="w-full px-3 py-2.5 text-sm font-mono border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="560001"
                    maxLength={6}
                  />
                  {errors.pincode && <p className="text-xs text-danger mt-1">{errors.pincode.message}</p>}
                </div>
              </div>
            </div>

            <button onClick={handleStep1Next} className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2">
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Document Upload */}
        {step === 2 && (
          <div className="card p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Document Upload
            </h2>

            <div className="space-y-4">
              <FileUploadBox
                label="PAN Card"
                description="Upload a clear photo of your PAN card"
                file={panFile}
                onFileChange={setPanFile}
                accept="image/*,.pdf"
              />

              <FileUploadBox
                label="Aadhaar Card"
                description="Upload front side of your Aadhaar card"
                file={aadhaarFile}
                onFileChange={setAadhaarFile}
                accept="image/*,.pdf"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Lock className="h-4 w-4 text-info shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600">
                <strong>Your data is safe.</strong> All documents are encrypted end-to-end using AES-256 
                encryption and stored in a secure vault. We comply with DPDP Act 2023 and RERA guidelines 
                for data protection. Your information is never shared with third parties.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-ghost flex-1 py-3 inline-flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleStep2Next}
                disabled={!panFile || !aadhaarFile}
                className="btn-primary flex-1 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Selfie */}
        {step === 3 && (
          <div className="card p-6 space-y-5">
            <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              Selfie Verification
            </h2>

            <p className="text-sm text-gray-600">
              Take a clear selfie to match with your PAN card photo. Ensure good lighting 
              and your face is clearly visible.
            </p>

            <FileUploadBox
              label="Selfie Photo"
              description="Upload a clear selfie or take one with your camera"
              file={selfieFile}
              onFileChange={setSelfieFile}
              accept="image/*"
            />

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-ghost flex-1 py-3 inline-flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={!selfieFile || submitting}
                className="btn-primary flex-1 py-3 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <svg viewBox="0 0 40 40" className="h-4 w-4 text-white animate-pulse" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 5L35 15V30L20 35L5 30V15L20 5Z" />
                    </svg>
                    {uploadProgress || 'Submitting…'}
                  </>
                ) : (
                  <>
                    Submit for Review
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="card p-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
              KYC Submitted Successfully!
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Your documents are being reviewed. This usually takes 24-48 hours.
              We'll notify you via email and SMS once approved.
            </p>
            <a href="/portal/investor" className="btn-primary inline-flex items-center gap-2">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        )}
        </div>
      </div>
    </MainLayout>
  )
}

function FileUploadBox({
  label,
  description,
  file,
  onFileChange,
  accept,
}: {
  label: string
  description: string
  file: File | null
  onFileChange: (file: File | null) => void
  accept: string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <div
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer',
          file ? 'border-success bg-green-50' : 'border-gray-200 hover:border-primary/30'
        )}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = accept
          input.onchange = (e) => {
            const f = (e.target as HTMLInputElement).files?.[0]
            if (f) onFileChange(f)
          }
          input.click()
        }}
      >
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-success">{file.name}</span>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">{description}</p>
            <p className="text-xs text-gray-400 mt-1">Max 5 MB · JPG, PNG, or PDF</p>
          </>
        )}
      </div>
    </div>
  )
}
