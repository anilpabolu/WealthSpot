import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  /** Page-specific title. Rendered as "Title | WealthSpot". Omit on the homepage to use the brand tagline. */
  title?: string
  description?: string
  /** Canonical URL path, e.g. "/vaults" */
  path?: string
  /** Comma-separated keywords for this page (optional). */
  keywords?: string
  /** og:image absolute URL */
  image?: string
  /** 'website' | 'article' */
  type?: string
  /** Set to true for authenticated / admin pages that should not be indexed */
  noIndex?: boolean
  /**
   * Optional JSON-LD structured data (schema.org). Pass a plain object;
   * it is serialized into a <script type="application/ld+json"> tag.
   * Enables rich results (breadcrumbs, products, FAQ, organization, etc.).
   */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

const SITE_NAME = 'WealthSpot'
const BASE_URL = 'https://wealthspot.in'
/** Used as the <title> on pages that don't pass an explicit title (e.g. the homepage). */
const DEFAULT_TITLE =
  'WealthSpot — Fractional Real Estate Investment in India'
const DEFAULT_DESCRIPTION =
  'Invest in premium, curated Indian real estate fractionally. WealthSpot offers Wealth, Safe, and Community Vaults — transparent, SEBI-conscious, and built for serious investors.'
const DEFAULT_KEYWORDS =
  'fractional real estate India, fractional property investment, real estate investment platform, invest in property India, fractional ownership, wealth vault, safe vault, community vault, passive real estate income, REIT alternative India'
const DEFAULT_IMAGE = `${BASE_URL}/og-default.png`
const TWITTER_HANDLE = '@wealthspot'

export default function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '',
  keywords = DEFAULT_KEYWORDS,
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
  jsonLd,
}: SEOHeadProps) {
  // Per-page title, suffixed with the brand. Homepage (no title) uses the full tagline.
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE
  const canonical = `${BASE_URL}${path}`
  const structured = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonical} />
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:creator" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD structured data (schema.org) for rich results */}
      {structured.map((data, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  )
}
