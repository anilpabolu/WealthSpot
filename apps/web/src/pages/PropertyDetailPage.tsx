import { useParams, Link } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import FundingBar from '@/components/wealth/FundingBar'
import IrrBadge from '@/components/wealth/IrrBadge'
import StatusBadge, { type StatusType } from '@/components/wealth/StatusBadge'
import { useProperty } from '@/hooks/useProperties'
import { useInvestmentStore } from '@/stores/investment.store'
import { formatINR, formatINRCompact, daysRemaining } from '@/lib/formatters'
import {
  MapPin, Calendar, Users, Building2, FileText, Shield,
  ArrowRight, ChevronLeft, Heart, Share2, CheckCircle2,
  Clock, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

function PropertyGallery({ images, title }: { images: string[]; title: string }) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (!images.length) {
    return (
      <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
        <Building2 className="h-16 w-16 text-gray-300" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-video rounded-xl overflow-hidden relative">
        <img
          src={images[activeIdx]}
          alt={`${title} - Image ${activeIdx + 1}`}
          className="w-full h-full object-cover"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setActiveIdx((i) => (i > 0 ? i - 1 : images.length - 1))}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveIdx((i) => (i < images.length - 1 ? i + 1 : 0))}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 ring-2 transition-all ${
                i === activeIdx ? 'ring-primary' : 'ring-transparent hover:ring-gray-300'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
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
  const [amount, setAmount] = useState(minInvestment)
  const units = Math.floor(amount / unitPrice)
  const daysLeft = daysRemaining(fundingDeadline)
  const isLive = status === 'funding' || status === 'active'

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
            onClick={() =>
              startInvestment({
                propertyId,
                propertyName,
                amount,
                units,
                minAmount: minInvestment,
                unitPrice,
              })
            }
            className="btn-primary w-full text-base py-3 inline-flex items-center justify-center gap-2"
          >
            Invest Now
            <ArrowRight className="h-5 w-5" />
          </button>
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
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
            <PropertyGallery images={property.gallery ?? [property.coverImage]} title={property.title} />

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

            {/* Description */}
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-3">About this Property</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

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
                <div>
                  <p className="font-semibold text-gray-900">{property.builderName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                    Verified Developer
                  </p>
                </div>
              </div>
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
    </MainLayout>
  )
}
