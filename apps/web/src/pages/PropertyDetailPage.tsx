import { useParams, Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import FundingBar from '@/components/wealth/FundingBar'
import IrrBadge from '@/components/wealth/IrrBadge'
import StatusBadge, { type StatusType } from '@/components/wealth/StatusBadge'
import { useProperty } from '@/hooks/useProperties'
import { useInvestmentStore } from '@/stores/investment.store'
import { useKycStatus } from '@/hooks/useKycBank'
import { formatINR, formatINRCompact, daysRemaining } from '@/lib/formatters'
import {
  MapPin, Calendar, Users, Building2, FileText, Shield,
  ArrowRight, ChevronLeft, Heart, Share2, CheckCircle2,
  Clock, ChevronRight, Play, Star, Sparkles, Phone, ExternalLink, User2,
  AlertCircle, X,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { apiPost } from '@/lib/api'

function PropertyGallery({ images, title, videoUrl }: { images: string[]; title: string; videoUrl?: string }) {
  const [activeIdx, setActiveIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const touchStartRef = useRef(0)

  const startAutoPlay = useCallback(() => {
    if (images.length <= 1) return
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
    }, 5000)
  }, [images.length])

  useEffect(() => {
    startAutoPlay()
    return () => clearInterval(intervalRef.current)
  }, [startAutoPlay])

  if (!images.length) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
        <Building2 className="h-16 w-16 text-gray-300" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div
        className="aspect-video rounded-xl overflow-hidden relative"
        onTouchStart={(e) => { touchStartRef.current = e.touches[0]?.clientX ?? 0 }}
        onTouchEnd={(e) => {
          const startX = touchStartRef.current
          const diff = startX - (e.changedTouches[0]?.clientX ?? 0)
          if (Math.abs(diff) > 50) {
            if (diff > 0) setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))
            else setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1))
            startAutoPlay()
          }
        }}
      >
        <img
          src={images[activeIdx]}
          alt={`${title} - Image ${activeIdx + 1}`}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement?.classList.add('bg-gray-100'); const placeholder = document.createElement('div'); placeholder.className = 'absolute inset-0 flex items-center justify-center bg-gray-100'; placeholder.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>'; (e.target as HTMLImageElement).parentElement?.appendChild(placeholder); }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => { setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1)); startAutoPlay() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => { setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0)); startAutoPlay() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setActiveIdx(i); startAutoPlay() }}
                  className={`h-2 rounded-full transition-all ${
                    i === activeIdx ? 'w-5 bg-white' : 'w-2 bg-white/60'
                  }`}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
        {/* Image counter */}
        <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
          {activeIdx + 1} / {images.length}
        </span>
        {/* Video link */}
        {videoUrl?.trim() && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 right-3 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Play className="h-4 w-4 fill-white" />
            Watch Video
          </a>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => { setActiveIdx(i); startAutoPlay() }}
              className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 ring-2 transition-all ${
                i === activeIdx ? 'ring-primary' : 'ring-transparent hover:ring-gray-300'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.classList.add('bg-gray-200'); }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function InvestmentPanel({
  propertyId,
  propertyName,
  minInvestment,
  unitPrice,
  raised,
  target,
  investorCount,
  status,
  fundingDeadline,
  irr,
}: {
  propertyId: string
  propertyName: string
  minInvestment: number
  unitPrice: number
  raised: number
  target: number
  investorCount: number
  status: string
  fundingDeadline: string
  irr: number
}) {
  const { startInvestment } = useInvestmentStore()
  const { data: kycData } = useKycStatus()
  const navigate = useNavigate()
  const [amount, setAmount] = useState(minInvestment)
  const units = Math.floor(amount / unitPrice)
  const daysLeft = daysRemaining(fundingDeadline)
  const isLive = status === 'funding' || status === 'active'
  const kycApproved = kycData?.kycStatus?.toLowerCase() === 'approved'

  return (
    <div className="card p-6 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <StatusBadge status={status as StatusType} />
        {daysLeft > 0 && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {daysLeft} days left
          </span>
        )}
      </div>

      <FundingBar raised={raised} target={target} showLabels showPercent showAmount />

      <div className="mt-3 mb-4 text-xs text-gray-500 flex items-center gap-1">
        <Users className="h-3.5 w-3.5" />
        {investorCount} investors
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase font-semibold">Target IRR</p>
          <IrrBadge value={irr} className="mt-1" />
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 uppercase font-semibold">Min. Invest</p>
          <p className="font-mono font-bold text-lg text-gray-900 mt-1">{formatINRCompact(minInvestment)}</p>
        </div>
      </div>

      {isLive && (
        <>
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Investment Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-sm">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.max(minInvestment, Number(e.target.value)))}
                min={minInvestment}
                step={unitPrice}
                className="w-full pl-8 pr-4 py-2.5 font-mono text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{units} units × {formatINR(unitPrice)}/unit</p>
          </div>

          <button
            onClick={() => {
              if (!kycApproved) {
                navigate('/settings?tab=kyc')
                return
              }
              startInvestment({
                propertyId,
                propertyName,
                amount,
                units,
                minAmount: minInvestment,
                unitPrice,
              })
            }}
            className="btn-primary w-full text-base py-3 inline-flex items-center justify-center gap-2"
          >
            Invest Now
            <ArrowRight className="h-5 w-5" />
          </button>

          {!kycApproved && (
            <p className="text-center text-xs text-amber-600 mt-2">
              KYC verification required before investing.{' '}
              <Link to="/settings?tab=kyc" className="underline font-semibold">Complete KYC</Link>
            </p>
          )}
        </>
      )}

      {status === 'upcoming' && (
        <button className="btn-secondary w-full text-base py-3">
          Notify Me When Live
        </button>
      )}

      <p className="text-center text-[11px] text-gray-400 mt-3">
        By investing, you agree to our <Link to="/legal/terms" className="underline">Terms</Link> and{' '}
        <Link to="/legal/risk-disclosure" className="underline">Risk Disclosure</Link>
      </p>
    </div>
  )
}

export default function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: property, isLoading } = useProperty(slug ?? '')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(t)
  }, [toast])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="skeleton aspect-video rounded-xl" />
              <div className="skeleton h-8 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-32 rounded-xl" />
            </div>
            <div className="skeleton h-96 rounded-xl" />
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!property) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-gray-900">Property Not Found</h2>
          <p className="text-gray-500 mt-1 mb-6">This property may have been removed or the URL is incorrect.</p>
          <Link to="/marketplace" className="btn-primary">
            Back to Marketplace
          </Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="page-section">
        <div className="page-section-container">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/marketplace" className="hover:text-primary">Marketplace</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 truncate">{property.title}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left — Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <PropertyGallery images={property.gallery?.length ? property.gallery : [property.coverImage]} title={property.title} videoUrl={property.videoUrl} />

            {/* Title / Location */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl lg:text-3xl font-bold text-gray-900">{property.title}</h1>
                  <p className="text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {property.micromarket}, {property.city}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50" aria-label="Save property">
                    <Heart className="h-5 w-5 text-gray-400" />
                  </button>
                  <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50" aria-label="Share property">
                    <Share2 className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-primary/5 text-primary text-xs font-medium rounded-full">{property.assetType}</span>
                {property.reraNumber && (
                  <span className="px-3 py-1 bg-green-50 text-success text-xs font-medium rounded-full flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    RERA: {property.reraNumber}
                  </span>
                )}
              </div>
            </div>

            {/* Referrer Info */}
            {property.referrerName && (
              <div className="card p-6 border-l-4 border-l-amber-400 bg-amber-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <User2 className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Referred By</p>
                      <p className="font-semibold text-gray-900">{property.referrerName}</p>
                      {property.referrerPhone && (
                        <p className="text-sm text-gray-500">{property.referrerPhone}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await apiPost('/notifications/enquiry', {
                          property_id: property.id,
                          message: `Enquiry for "${property.title}" from the property detail page`,
                        })
                        setToast({ type: 'success', message: 'Your enquiry has been sent! The referrer/builder will contact you shortly.' })
                      } catch {
                        setToast({ type: 'error', message: 'Could not send enquiry. Please try again.' })
                      }
                    }}
                    className="btn-primary text-sm flex items-center gap-2 shrink-0"
                  >
                    <Phone className="h-4 w-4" />
                    Enquire Now
                  </button>
                </div>
              </div>
            )}

            {/* Location Details */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {property.address && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-0.5">Address</p>
                    <p className="text-sm font-medium text-gray-900">{property.address}</p>
                  </div>
                )}
                {property.micromarket && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-0.5">Area / Locality</p>
                    <p className="text-sm font-medium text-gray-900">{property.micromarket}</p>
                  </div>
                )}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-0.5">City</p>
                  <p className="text-sm font-medium text-gray-900">{property.city}</p>
                </div>
                {property.reraNumber && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-0.5">RERA ID</p>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5 text-green-500" />
                      {property.reraNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-3">About this Property</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* Property Highlights */}
            {property.highlights?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  Property Highlights
                </h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {property.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 bg-amber-50/50 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-700">{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* USP */}
            {property.usp && (
              <div className="card p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                <h2 className="font-display text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Unique Selling Point
                </h2>
                <p className="text-sm text-gray-700 leading-relaxed">{property.usp}</p>
              </div>
            )}

            {/* Key Details */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Key Details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Asset Type</p>
                    <p className="text-sm font-semibold text-gray-900 capitalize">{property.assetType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">₹</span>
                  <div>
                    <p className="text-xs text-gray-500">Unit Price</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{formatINR(property.unitPrice)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Total Units</p>
                    <p className="text-sm font-semibold text-gray-900">{property.totalUnits} ({property.soldUnits} sold)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Expected Completion</p>
                    <p className="text-sm font-semibold text-gray-900">{'TBD'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Builder Info */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Developer</h2>
              <div className="flex items-center gap-4">
                {property.builderLogo ? (
                  <img src={property.builderLogo} alt={property.builderName} className="h-12 w-12 rounded-lg object-contain border border-gray-200" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{property.builderName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    Verified Developer
                  </p>
                </div>
              </div>
              {property.builderId && (
                <Link
                  to={`/builder/${property.builderId}`}
                  className="mt-4 inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                >
                  Want to know more about the builder? Click here
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>

            {/* Documents */}
            {property.documents?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Documents</h2>
                <div className="space-y-2">
                  {property.documents.map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500 uppercase">{doc.type}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <span key={a} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-lg">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Investment Panel */}
          <div className="lg:col-span-1">
            <InvestmentPanel
              propertyId={property.id}
              propertyName={property.title}
              minInvestment={property.minInvestment}
              unitPrice={property.unitPrice}
              raised={property.raised}
              target={property.target}
              investorCount={property.investorCount}
              status={property.status}
              fundingDeadline={''}
              irr={property.targetIrr}
            />
          </div>
        </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 p-0.5 hover:bg-black/5 rounded">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </MainLayout>
  )
}
