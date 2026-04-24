import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title?: string
  description?: string
  /** Canonical URL path, e.g. "/vaults" */
  path?: string
  /** og:image absolute URL */
  image?: string
  /** 'website' | 'article' */
  type?: string
  /** Set to true for authenticated / admin pages that should not be indexed */
  noIndex?: boolean
}

const SITE_NAME = 'WealthSpot'
const BASE_URL = 'https://wealthspot.in'
const DEFAULT_DESCRIPTION =
  'WealthSpot — Democratizing premium real estate. Fractional investments across Wealth, Safe, and Community Vaults starting from ₹10,000.'
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png`

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Democratizing Premium Assets`
  const canonical = `${BASE_URL}${path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
