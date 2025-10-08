import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import type { PrintfulPodProductService } from "../printful-pod-product-service"
import { PODProviderManager, PrintfulProvider } from "../pod-provider-facade"
import { ArtworkModuleService } from "../../../artwork-module/services/artwork-module-service"
import type {
  PrintfulStudioArtwork,
  PrintfulStudioArtworkLink,
  PrintfulStudioAssetSummary,
  PrintfulStudioCatalogDetail,
  PrintfulStudioCatalogProduct,
  PrintfulStudioDashboardPayload,
  PrintfulStudioDashboardMetrics,
  PrintfulStudioHealthStatus,
  PrintfulStudioImportState,
  PrintfulStudioSettingsSummary,
  PrintfulStudioVariantAsset,
  PrintfulStudioVersion,
  PrintfulStudioMockupRequest,
  PrintfulStudioMockupResult,
} from "./types"

interface ArtworkRelationRecord {
  id: string
  artwork_id: string
  product_id: string
  product_type: string
  is_primary?: boolean
  position?: number
}

interface ArtworkRecord {
  id: string
  title: string
  description?: string | null
  image_url?: string | null
  artwork_collection_id?: string | null
  product_ids?: string[] | null
}

interface MedusaProductSummary {
  id: string
  status: string
  title: string
  handle?: string | null
  thumbnail?: string | null
  updated_at?: string | null
  metadata?: Record<string, unknown> | null
}

export abstract class PrintfulStudioBaseService {
  protected readonly container: any
  protected readonly version: PrintfulStudioVersion
  protected podProviderManager: PODProviderManager
  protected printfulProvider: PrintfulProvider
  protected productService: PrintfulPodProductService | null = null
  protected artworkService: ArtworkModuleService | null = null
  protected productModuleService: IProductModuleService | null = null

  private artworkCache: PrintfulStudioArtwork[] | null = null
  private artworkProductIndex: Map<string, PrintfulStudioArtworkLink[]> | null = null
  private medusaProductIndex: Map<string, MedusaProductSummary> | null = null
  private medusaProductIndexFetchedAt = 0
  private medusaIndexTTL = 1000 * 15 // 15 seconds to avoid spamming product module

  constructor(container: any, version: PrintfulStudioVersion) {
    this.container = container
    this.version = version

    this.podProviderManager = this.resolveProviderManager(container)
    this.printfulProvider = this.podProviderManager.getProvider("printful") as PrintfulProvider

    if (typeof this.printfulProvider.getInternalProductService === "function") {
      this.productService = this.printfulProvider.getInternalProductService()
    }

    this.artworkService = this.resolveArtworkService(container)
    this.productModuleService = this.resolveProductModuleService(container)
  }

  abstract listCatalog(): Promise<PrintfulStudioCatalogProduct[]>

  abstract getProductDetail(productId: string): Promise<PrintfulStudioCatalogDetail | null>

  abstract getCapabilities(): string[]

  async getDashboard(): Promise<PrintfulStudioDashboardPayload> {
    const [catalog, artworks, health] = await Promise.all([
      this.listCatalog().catch(() => []),
      this.listArtworks().catch(() => []),
      this.performHealthCheck().catch((err) => ({
        version: this.version,
        status: "error" as const,
        message: err?.message ?? "Health check failed",
        timestamp: new Date().toISOString(),
      })),
    ])

    const metrics: PrintfulStudioDashboardMetrics = {
      version: this.version,
      total_products: catalog.length,
      linked_products: catalog.filter((product) => product.linked_artworks.length > 0).length,
      total_variants: catalog.reduce((acc, product) => acc + (product.variant_count || 0), 0),
      artworks: artworks.length,
      artworks_without_products: artworks.filter((artwork) => artwork.linked_products.length === 0).length,
    }

    return {
      version: this.version,
      fetched_at: new Date().toISOString(),
      metrics,
      capabilities: this.getCapabilities(),
      health,
    }
  }

  async listArtworks(): Promise<PrintfulStudioArtwork[]> {
    if (this.artworkCache) {
      return this.artworkCache
    }

    if (!this.artworkService) {
      this.artworkCache = []
      this.artworkProductIndex = new Map()
      return this.artworkCache
    }

    const [artworksRaw, relationsRaw] = await Promise.all([
      this.artworkService
        .listArtworks({}, { limit: 1000 })
        .catch(() => []) as Promise<ArtworkRecord[]>,
      this.artworkService
        .listArtworkProductRelations({}, { limit: 1000 })
        .catch(() => []) as Promise<ArtworkRelationRecord[]>,
    ])

    const relationLinks: PrintfulStudioArtworkLink[] = relationsRaw.map((relation) => ({
      artwork_id: relation.artwork_id,
      artwork_title: "",
      product_id: relation.product_id,
      product_type: relation.product_type,
      is_primary: relation.is_primary,
      source: "relation",
      api_version: this.detectVersionFromProductType(relation.product_type),
    }))

    const artworks: PrintfulStudioArtwork[] = artworksRaw.map((artwork) => {
      const links: PrintfulStudioArtworkLink[] = relationLinks
        .filter((link) => link.artwork_id === artwork.id)
        .map((link) => ({ ...link }))

      const legacyForArtwork: PrintfulStudioArtworkLink[] = Array.isArray(artwork.product_ids)
        ? artwork.product_ids.map((productId) => ({
            artwork_id: artwork.id,
            artwork_title: "",
            product_id: productId,
            product_type: "printful_pod",
            source: "legacy",
            api_version: "unknown",
          }))
        : []

      const combinedLinks = [...links, ...legacyForArtwork].map((link) => ({
        ...link,
        artwork_title: artwork.title,
        artwork_image: artwork.image_url,
      }))

      return {
        id: artwork.id,
        title: artwork.title,
        description: artwork.description,
        image_url: artwork.image_url,
        collection_id: artwork.artwork_collection_id,
        linked_products: combinedLinks,
      }
    })

    const productIndex = new Map<string, PrintfulStudioArtworkLink[]>()
    artworks.forEach((artwork) => {
      artwork.linked_products.forEach((link) => {
        const links = productIndex.get(link.product_id) ?? []
        links.push(link)
        productIndex.set(link.product_id, links)
      })
    })

    this.artworkCache = artworks
    this.artworkProductIndex = productIndex

    return artworks
  }

  async listArtworkLinksForProduct(productId: string): Promise<PrintfulStudioArtworkLink[]> {
    if (!this.artworkProductIndex) {
      await this.listArtworks()
    }

    return this.artworkProductIndex?.get(productId) ?? []
  }

  async getSettingsSummary(): Promise<PrintfulStudioSettingsSummary> {
    const health = await this.performHealthCheck()

    return {
      version: this.version,
      has_api_token: Boolean(process.env.PRINTFUL_API_TOKEN),
      environment: process.env.PRINTFUL_ENVIRONMENT || "production",
      store_id: process.env.PRINTFUL_STORE_ID || null,
      region: process.env.PRINTFUL_REGION || null,
      currency: process.env.PRINTFUL_CURRENCY || null,
      capabilities: this.getCapabilities(),
      health,
    }
  }

  protected async performHealthCheck(): Promise<PrintfulStudioHealthStatus> {
    if (!process.env.PRINTFUL_API_TOKEN) {
      return {
        version: this.version,
        status: "error",
        message: "PRINTFUL_API_TOKEN missing",
        timestamp: new Date().toISOString(),
      }
    }

    try {
      if (this.productService) {
        await this.pingProductService()
      }

      return {
        version: this.version,
        status: "ok",
        message: "Printful API reachable",
        timestamp: new Date().toISOString(),
      }
    } catch (error: any) {
      return {
        version: this.version,
        status: "warning",
        message: error?.message ?? "Failed to reach Printful API",
        timestamp: new Date().toISOString(),
      }
    }
  }

  async checkHealth(): Promise<PrintfulStudioHealthStatus> {
    return this.performHealthCheck()
  }

  protected abstract pingProductService(): Promise<void>

  protected detectVersionFromProductType(productType: string | null | undefined): PrintfulStudioVersion | "unknown" {
    if (!productType) {
      return "unknown"
    }

    if (productType.includes("v2")) {
      return "v2"
    }

    if (productType.includes("v1")) {
      return "v1"
    }

    return "unknown"
  }

  protected async getMedusaProductSummary(printfulProductId: string): Promise<MedusaProductSummary | null> {
    const index = await this.getMedusaProductIndex()
    return index.get(printfulProductId) ?? null
  }

  protected async getMedusaProductIndex(): Promise<Map<string, MedusaProductSummary>> {
    const now = Date.now()
    if (this.medusaProductIndex && now - this.medusaProductIndexFetchedAt < this.medusaIndexTTL) {
      return this.medusaProductIndex
    }

    if (!this.productModuleService) {
      this.medusaProductIndex = new Map()
      this.medusaProductIndexFetchedAt = now
      return this.medusaProductIndex
    }

    try {
      const products = await this.productModuleService.listProducts(
        {},
        {
          select: ["id", "title", "status", "handle", "metadata", "thumbnail", "updated_at"],
        }
      )

      const map = new Map<string, MedusaProductSummary>()

      for (const product of products as any[]) {
        const metadata = product.metadata || {}
        const printfulId = metadata.printful_product_id || metadata.printfulProductId

        if (!printfulId) {
          continue
        }

        map.set(String(printfulId), {
          id: product.id,
          status: product.status,
          title: product.title,
          handle: product.handle,
          thumbnail: product.thumbnail,
          updated_at: product.updated_at,
          metadata,
        })
      }

      this.medusaProductIndex = map
      this.medusaProductIndexFetchedAt = now
      return map
    } catch (error) {
      console.error("[PrintfulStudio] Failed to build Medusa product index", error)
      this.medusaProductIndex = new Map()
      this.medusaProductIndexFetchedAt = now
      return this.medusaProductIndex
    }
  }

  protected resolveImportState(medusaSummary: MedusaProductSummary | null): PrintfulStudioImportState {
    if (!medusaSummary) {
      return "not_imported"
    }

    if (medusaSummary.status === "published") {
      return "imported"
    }

    if (medusaSummary.status === "draft") {
      return "imported_draft"
    }

    return "imported_disabled"
  }

  protected resolveAvailableToOrder(medusaSummary: MedusaProductSummary | null): boolean {
    if (!medusaSummary) {
      return false
    }

    return medusaSummary.status === "published"
  }

  async generateMockups({
    productId,
    variantIds,
    artworkId,
    artworkUrl,
    mockupStyleIds,
    maxMockups,
    waitForCompletion = true,
  }: PrintfulStudioMockupRequest): Promise<PrintfulStudioMockupResult> {
    if (!this.productService?.generateAndWaitForMockups) {
      throw new Error("Printful mockup generation is unavailable")
    }

    const artwork = await this.resolveArtworkAsset(productId, artworkId, artworkUrl)
    const resolvedVariantIds = variantIds?.length ? variantIds : await this.resolveDefaultVariantIds(productId)

    if (!resolvedVariantIds.length) {
      throw new Error("No variant IDs available for mockup generation")
    }

    const limit = maxMockups && maxMockups > 0 ? Math.min(maxMockups, resolvedVariantIds.length) : resolvedVariantIds.length
    const selectedVariantIds = resolvedVariantIds.slice(0, limit)

    // Wait time calculation:
    // With rate limit of 2 req/min (30s between requests), polling 20 variants takes ~10 minutes
    // Formula: (variants * 30s) + buffer = timeout
    const baseTimeout = waitForCompletion ? 90000 : 5000
    const rateLimitTimeout = selectedVariantIds.length * 30000 + 60000 // 30s per variant + 60s buffer
    const maxWaitTime = waitForCompletion ? Math.max(baseTimeout, rateLimitTimeout) : baseTimeout

    if (selectedVariantIds.length > 3) {
      console.log(`[PrintfulStudioService] ⚠️  Large variant count (${selectedVariantIds.length}). Timeout extended to ${Math.round(maxWaitTime/1000)}s due to rate limits.`)
    }

    console.log('[PrintfulStudioService] Generating mockups:', {
      productId,
      variantCount: selectedVariantIds.length,
      variantIds: selectedVariantIds,
      mockupStyleIds: mockupStyleIds || 'auto-select',
      artworkUrl: artwork.url,
      maxWaitTime,
      waitForCompletion
    })

    const mockupUrls = await this.productService.generateAndWaitForMockups(
      productId,
      selectedVariantIds,
      artwork.url,
      maxWaitTime,
      undefined, // placement
      undefined, // technique
      mockupStyleIds, // Pass mockup style IDs
      undefined // product options - will be passed from UI
    )

    console.log('[PrintfulStudioService] Mockup generation complete:', {
      mockupCount: mockupUrls.length,
      expectedCount: selectedVariantIds.length
    })

    return {
      product_id: productId,
      variant_ids: selectedVariantIds,
      artwork: {
        id: artwork.artworkId ?? artworkId ?? null,
        url: artwork.url,
      },
      mockup_urls: mockupUrls,
    }
  }

  protected async resolveDefaultVariantIds(productId: string): Promise<string[]> {
    if (!this.productService) {
      return []
    }

    try {
      if (this.version === "v2" && typeof (this.productService as any).getCatalogProduct === "function") {
        const catalogProduct = await (this.productService as any).getCatalogProduct(productId)
        if (catalogProduct?.variants) {
          return catalogProduct.variants
            .map((variant: any) => this.extractCatalogVariantId(variant))
            .filter((id: string | null): id is string => Boolean(id))
        }
      }

      if (typeof (this.productService as any).getSyncProduct === "function") {
        const syncProduct = await (this.productService as any).getSyncProduct(productId)
        const variantsSource = Array.isArray(syncProduct?.sync_variants)
          ? syncProduct.sync_variants
          : Array.isArray(syncProduct?.variants)
            ? syncProduct.variants
            : []

        const ids = variantsSource
          .map((variant: any) => this.extractCatalogVariantId(variant))
          .filter((id: string | null): id is string => Boolean(id))

        if (ids.length) {
          return ids
        }
      }

      if (typeof (this.productService as any).getStoreProduct === "function") {
        const storeProduct = await (this.productService as any).getStoreProduct(productId)
        const variantsSource = Array.isArray(storeProduct?.sync_variants)
          ? storeProduct.sync_variants
          : Array.isArray(storeProduct?.variants)
            ? storeProduct.variants
            : []

        return variantsSource
          .map((variant: any) => this.extractCatalogVariantId(variant))
          .filter((id: string | null): id is string => Boolean(id))
      }
    } catch (error) {
      console.error(`[PrintfulStudio] Failed to resolve variant ids for product ${productId}`, error)
    }

    return []
  }

  protected async resolveArtworkAsset(
    productId: string,
    artworkId?: string,
    artworkUrl?: string
  ): Promise<{ artworkId?: string | null; url: string }> {
    console.log('[PrintfulStudioService] Resolving artwork asset:', {
      productId,
      artworkId,
      artworkUrl
    })

    if (artworkUrl) {
      console.log('[PrintfulStudioService] Using provided artwork URL')
      return { artworkId: artworkId ?? null, url: artworkUrl }
    }

    let targetArtworkId = artworkId ?? null
    let targetArtworkUrl: string | null | undefined = null

    const linkedArtworks = await this.listArtworkLinksForProduct(productId)
    console.log('[PrintfulStudioService] Linked artworks:', linkedArtworks.length)

    if (!targetArtworkId && linkedArtworks.length) {
      const preferred = linkedArtworks.find((link) => link.is_primary) ?? linkedArtworks[0]
      targetArtworkId = preferred.artwork_id
      targetArtworkUrl = preferred.artwork_image
    } else if (targetArtworkId) {
      const matchingLink = linkedArtworks.find((link) => link.artwork_id === targetArtworkId)
      targetArtworkUrl = matchingLink?.artwork_image
    }

    if (!targetArtworkUrl && targetArtworkId && this.artworkService) {
      try {
        const records = await this.artworkService.listArtworks({ id: targetArtworkId }, { limit: 1 })
        const artwork = Array.isArray(records) ? records[0] : null
        targetArtworkUrl = artwork?.image_url ?? null
      } catch (error) {
        console.warn(`[PrintfulStudio] Failed to fetch artwork ${targetArtworkId}:`, error)
      }
    }

    if (!targetArtworkUrl) {
      throw new Error(
        "Artwork image is required to generate mockups. Link an artwork to this product or provide an artwork URL."
      )
    }

    return { artworkId: targetArtworkId, url: targetArtworkUrl }
  }

  protected extractCatalogVariantId(variant: any): string | null {
    if (!variant) {
      return null
    }

    const candidate =
      variant.catalog_variant_id ??
      variant.product?.variant_id ??
      variant.variant_id ??
      variant.external_variant_id ??
      variant.external_id ??
      variant.id

    if (candidate === undefined || candidate === null) {
      return null
    }

    return candidate.toString()
  }

  protected buildAssetSummary(
    printfulProduct: any,
    medusaMetadata?: Record<string, unknown> | null
  ): PrintfulStudioAssetSummary {
    // Prefer stored metadata if present (import step calculates precise counts)
    const stored = medusaMetadata?.image_sources as any

    const gallery = new Set<string>()
    let mockups = 0
    let variantFiles = 0
    let variantImages = 0

    const addUrl = (url?: string | null) => {
      if (url) {
        gallery.add(url)
      }
    }

    addUrl(printfulProduct?.thumbnail_url || printfulProduct?.image)

    const variants = Array.isArray(printfulProduct?.sync_variants)
      ? printfulProduct.sync_variants
      : Array.isArray(printfulProduct?.variants)
        ? printfulProduct.variants
        : []

    for (const variant of variants) {
      if (variant?.image) {
        addUrl(variant.image)
        variantImages += 1
      }

      if (Array.isArray(variant?.files)) {
        for (const file of variant.files) {
          const url = file?.preview_url || file?.thumbnail_url || file?.url
          if (url) {
            addUrl(url)
            const type = (file?.type || "").toString().toLowerCase()
            if (type.includes("mockup")) {
              mockups += 1
            } else {
              variantFiles += 1
            }
          }
        }
      }
    }

    if (stored && typeof stored === "object") {
      mockups = Number(stored.mockups ?? mockups)
      variantFiles = Number(stored.variants ?? variantFiles)
    }

    const galleryArray = Array.from(gallery)

    return {
      total: galleryArray.length,
      thumbnail: galleryArray[0] ?? printfulProduct?.thumbnail_url ?? null,
      mockups,
      variant_files: variantFiles,
      variant_images: variantImages,
      gallery: galleryArray,
    }
  }

  protected buildVariantAssets(printfulProduct: any): PrintfulStudioVariantAsset[] {
    const variantsSource = Array.isArray(printfulProduct?.sync_variants)
      ? printfulProduct.sync_variants
      : Array.isArray(printfulProduct?.variants)
        ? printfulProduct.variants
        : []

    return variantsSource.map((variant: any) => ({
      id: String(variant?.id ?? variant?.variant_id ?? Math.random().toString(36).slice(2)),
      name: String(variant?.name ?? variant?.sku ?? "Variant"),
      sku: variant?.sku ?? variant?.external_sku ?? null,
      retail_price: variant?.retail_price ?? variant?.price ?? null,
      currency: variant?.currency ?? null,
      availability: variant?.availability ?? variant?.availability_status ?? null,
      catalog_variant_id: this.extractCatalogVariantId(variant),
      files: Array.isArray(variant?.files)
        ? variant.files.map((file: any) => ({
            id: file?.id ?? null,
            type: file?.type ?? null,
            preview_url: file?.preview_url ?? file?.thumbnail_url ?? null,
            url: file?.url ?? null,
          }))
        : [],
    }))
  }

  private resolveProviderManager(container: any): PODProviderManager {
    if (container?.resolve) {
      try {
        return container.resolve("printfulModule") as PODProviderManager
      } catch (error) {
        // fall through
      }
    }

    return new PODProviderManager(container)
  }

  private resolveArtworkService(container: any): ArtworkModuleService | null {
    if (container?.resolve) {
      try {
        return container.resolve("artworkModuleService") as ArtworkModuleService
      } catch (error) {
        return null
      }
    }

    return null
  }

  private resolveProductModuleService(container: any): IProductModuleService | null {
    if (container?.resolve) {
      try {
        return container.resolve(Modules.PRODUCT) as IProductModuleService
      } catch (error) {
        return null
      }
    }

    return null
  }
}
