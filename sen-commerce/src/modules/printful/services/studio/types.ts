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
  medusa_product_id?: string | null
}

export interface PrintfulStudioArtwork {
  id: string
  title: string
  description?: string | null
  image_url?: string | null
  collection_id?: string | null
  linked_products: PrintfulStudioArtworkLink[]
}

export type PrintfulStudioImportState =
  | "not_imported"
  | "imported"
  | "imported_draft"
  | "imported_disabled"

export interface PrintfulStudioCatalogVariant {
  id: string
  name: string
  price?: number
  currency?: string
  size?: string
  color?: string
  availability?: string
  image?: string
  sku?: string
  catalog_variant_id?: string | null
}

export interface PrintfulStudioAssetSummary {
  total: number
  thumbnail?: string | null
  mockups: number
  variant_files: number
  variant_images: number
  gallery: string[]
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
  import_state: PrintfulStudioImportState
  available_to_order: boolean
  medusa_product_id?: string | null
  medusa_product_status?: string | null
  medusa_product_handle?: string | null
  primary_artwork_id?: string | null
  asset_summary?: PrintfulStudioAssetSummary
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

export interface PrintfulStudioVariantAsset {
  id: string
  name: string
  sku?: string | null
  retail_price?: string | number | null
  currency?: string | null
  availability?: string | null
  catalog_variant_id?: string | null
  files: {
    id?: string | null
    type?: string | null
    preview_url?: string | null
    url?: string | null
  }[]
}

export interface PrintfulStudioCatalogDetail {
  product: PrintfulStudioCatalogProduct
  variants: PrintfulStudioVariantAsset[]
  assets: PrintfulStudioAssetSummary
  artworks: PrintfulStudioArtworkLink[]
  medusa?: {
    id: string
    status: string
    title: string
    handle?: string | null
    thumbnail?: string | null
    updated_at?: string | null
    metadata?: Record<string, unknown> | null
  } | null
  printful_raw?: Record<string, unknown>
}

export interface PrintfulStudioMockupRequest {
  productId: string
  variantIds?: string[]
  artworkId?: string
  artworkUrl?: string
  maxMockups?: number
  waitForCompletion?: boolean
}

export interface PrintfulStudioMockupResult {
  product_id: string
  variant_ids: string[]
  artwork: {
    id?: string | null
    url: string
  }
  mockup_urls: string[]
}

// ===== Studio Composer Types =====

export interface PrintfulStudioComposerSession {
  id: string
  artwork_id?: string | null
  catalog_product_id?: string | null
  state: PrintfulStudioComposerState
  created_at: string
  updated_at: string
}

export type PrintfulStudioComposerState =
  | 'artwork_selection'
  | 'product_selection'
  | 'design_configuration'
  | 'mockup_generation'
  | 'details_entry'
  | 'pricing_setup'
  | 'ready_to_create'
  | 'creating'
  | 'completed'
  | 'failed'

export interface PrintfulStudioComposerArtworkTab {
  artwork_id?: string | null
  artwork_url?: string | null
  artwork_title?: string | null
  printful_file_id?: string | null
  placements?: PrintfulStudioPlacement[]
}

export interface PrintfulStudioPlacement {
  id: string
  name: string
  position: { x: number; y: number }
  scale: number
  rotation: number
  technique?: 'dtg' | 'embroidery' | 'sublimation' | 'screen_print'
}

export interface PrintfulStudioComposerProductTab {
  catalog_product_id: string
  catalog_product_name: string
  selected_variant_ids: string[]
  selected_colors?: string[]
  selected_sizes?: string[]
}

export interface PrintfulStudioComposerDesignTab {
  technique: 'dtg' | 'embroidery' | 'sublimation' | 'screen_print'
  preview_urls?: string[]
}

export interface PrintfulStudioComposerMockupsTab {
  mockup_task_id?: string | null
  mockup_status?: 'pending' | 'processing' | 'completed' | 'failed'
  mockup_urls: string[]
  selected_mockup_urls: string[]
}

export interface PrintfulStudioComposerDetailsTab {
  product_title: string
  product_description?: string | null
  tags?: string[]
  category?: string | null
}

export interface PrintfulStudioComposerPricingTab {
  base_costs: Record<string, number> // variantId -> cost
  markup_type: 'fixed' | 'percentage'
  markup_value: number
  retail_prices: Record<string, number> // variantId -> retail price
  currency: string
}

export interface PrintfulStudioComposerData {
  session_id: string
  state: PrintfulStudioComposerState
  artwork: PrintfulStudioComposerArtworkTab
  product: PrintfulStudioComposerProductTab | null
  design: PrintfulStudioComposerDesignTab | null
  mockups: PrintfulStudioComposerMockupsTab | null
  details: PrintfulStudioComposerDetailsTab | null
  pricing: PrintfulStudioComposerPricingTab | null
  created_at: string
  updated_at: string
}

export interface PrintfulStudioCreateProductRequest {
  composer_session_id: string
  auto_import_to_medusa?: boolean
  medusa_status?: 'draft' | 'published'
}

export interface PrintfulStudioCreateProductResult {
  success: boolean
  printful_product_id?: string | null
  medusa_product_id?: string | null
  sync_product?: any
  medusa_product?: any
  errors?: string[]
}

export interface PrintfulStudioBatchCreateRequest {
  artwork_ids: string[]
  catalog_product_ids: string[]
  auto_generate_mockups?: boolean
  auto_import_to_medusa?: boolean
  pricing_config?: {
    markup_type: 'fixed' | 'percentage'
    markup_value: number
  }
}

export interface PrintfulStudioBatchCreateResult {
  total: number
  created: number
  failed: number
  results: Array<{
    artwork_id: string
    catalog_product_id: string
    success: boolean
    printful_product_id?: string | null
    medusa_product_id?: string | null
    error?: string | null
  }>
}
