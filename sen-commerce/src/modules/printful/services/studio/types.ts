export type PrintfulStudioVersion = "v1" | "v2"

export interface PrintfulStudioHealthStatus {
  version: PrintfulStudioVersion
  status: "ok" | "warning" | "error"
  message?: string
  timestamp: string
  rate_limit_remaining?: number
  rate_limit_reset?: string
}

export interface PrintfulStudioSettingsSummary {
  version: PrintfulStudioVersion
  has_api_token: boolean
  environment: string
  store_id?: string | null
  region?: string | null
  currency?: string | null
  capabilities: string[]
  health: PrintfulStudioHealthStatus
}

export interface PrintfulStudioArtworkLink {
  artwork_id: string
  artwork_title: string
  artwork_image?: string | null
  product_id: string
  product_type: string
  is_primary?: boolean
  source: "relation" | "legacy"
  api_version?: PrintfulStudioVersion | "unknown"
}

export interface PrintfulStudioArtwork {
  id: string
  title: string
  description?: string | null
  image_url?: string | null
  collection_id?: string | null
  linked_products: PrintfulStudioArtworkLink[]
}

export interface PrintfulStudioCatalogVariant {
  id: string
  name: string
  price?: number
  currency?: string
  size?: string
  color?: string
  availability?: string
  image?: string
}

export interface PrintfulStudioCatalogProduct {
  id: string
  external_id?: string | null
  version: PrintfulStudioVersion
  source: "catalog" | "store"
  provider: string
  name: string
  description?: string | null
  thumbnail_url?: string | null
  variant_count: number
  variants: PrintfulStudioCatalogVariant[]
  linked_artworks: PrintfulStudioArtworkLink[]
  last_synced_at?: string | null
  metadata?: Record<string, unknown>
}

export interface PrintfulStudioDashboardMetrics {
  version: PrintfulStudioVersion
  total_products: number
  linked_products: number
  total_variants: number
  artworks: number
  artworks_without_products: number
}

export interface PrintfulStudioDashboardPayload {
  version: PrintfulStudioVersion
  fetched_at: string
  metrics: PrintfulStudioDashboardMetrics
  capabilities: string[]
  health: PrintfulStudioHealthStatus
}
