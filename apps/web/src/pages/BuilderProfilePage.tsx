import { useParams, Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout'
import { useBuilderProfile } from '@/hooks/useProperties'
import { type StatusType } from '@/components/wealth/StatusBadge'
import PropertyCard from '@/components/wealth/PropertyCard'
import {
  Building2, MapPin, Phone, Mail, Globe, Shield, CheckCircle2,
  ChevronRight, Briefcase, Ruler, Calendar,
} from 'lucide-react'

export default function BuilderProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: builder, isLoading } = useBuilderProfile(id ?? '')

  if (isLoading) {
    return (
      <MainLayout>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="skeleton h-8 w-1/3 mb-4" />
          <div className="skeleton h-4 w-1/4 mb-8" />
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-40 rounded-xl" />
        </div>
      </MainLayout>
    )
  }

  if (!builder) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold text-gray-900">Builder Not Found</h2>
          <p className="text-gray-500 mt-1 mb-6">This builder profile may have been removed.</p>
          <Link to="/marketplace" className="btn-primary">Back to Marketplace</Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="page-section">
        <div className="page-section-container max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/marketplace" className="hover:text-primary">Marketplace</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 truncate">{builder.companyName}</span>
        </nav>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-5">
            {builder.logoUrl ? (
              <img src={builder.logoUrl} alt={builder.companyName} className="h-20 w-20 rounded-xl object-contain border border-gray-200" />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-gray-100 flex items-center justify-center">
                <Building2 className="h-10 w-10 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-gray-900 truncate">{builder.companyName}</h1>
                {builder.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Verified
                  </span>
                )}
              </div>
              {builder.city && (
                <p className="text-gray-500 flex items-center gap-1 mt-1">
                  <MapPin className="h-4 w-4" />
                  {builder.city}
                </p>
              )}
              {builder.reraNumber && (
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5 text-green-500" />
                  RERA: {builder.reraNumber}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          {builder.experienceYears != null && (
            <div className="card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Experience</p>
                <p className="font-bold text-gray-900">{builder.experienceYears} years</p>
              </div>
            </div>
          )}
          {builder.projectsCompleted != null && (
            <div className="card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Projects Completed</p>
                <p className="font-bold text-gray-900">{builder.projectsCompleted}</p>
              </div>
            </div>
          )}
          {builder.totalSqftDelivered != null && (
            <div className="card p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Ruler className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold">Total Sq.Ft Delivered</p>
                <p className="font-bold text-gray-900">{(builder.totalSqftDelivered).toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}
        </div>

        {/* About */}
        {(builder.about || builder.description) && (
          <div className="card p-6 mb-6">
            <h2 className="font-display text-lg font-bold text-gray-900 mb-3">About</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {builder.about || builder.description}
            </p>
          </div>
        )}

        {/* Contact Info */}
        <div className="card p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {builder.phone && (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{builder.phone}</p>
                </div>
              </div>
            )}
            {builder.email && (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{builder.email}</p>
                </div>
              </div>
            )}
            {builder.address && (
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">{builder.address}</p>
                </div>
              </div>
            )}
            {builder.website && (
              <a
                href={builder.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Globe className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Website</p>
                  <p className="text-sm font-medium text-primary">{builder.website}</p>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Builder's Properties */}
        {builder.properties.length > 0 && (
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-4">
              Listings by {builder.companyName} ({builder.properties.length})
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {builder.properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  title={p.title}
                  city={p.city}
                  micromarket={p.micromarket}
                  assetType={p.assetType}
                  coverImage={p.coverImage}
                  gallery={p.gallery}
                  videoUrl={p.videoUrl}
                  targetIrr={p.targetIrr}
                  minInvestment={p.minInvestment}
                  raised={p.raised}
                  target={p.target}
                  investorCount={p.investorCount}
                  reraNumber={p.reraNumber}
                  status={p.status as StatusType}
                  onCardClick={() => navigate(`/marketplace/${p.slug}`)}
                  onInvestClick={() => navigate(`/marketplace/${p.slug}`)}
                />
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </MainLayout>
  )
}
