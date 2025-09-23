import type { PrintfulPodProductService } from "../printful-pod-product-service"
import { PODProviderManager, PrintfulProvider } from "../pod-provider-facade"
import { ArtworkModuleService } from "../../../artwork-module/services/artwork-module-service"
import type {
  PrintfulStudioArtwork,
  PrintfulStudioArtworkLink,
  PrintfulStudioCatalogProduct,
  PrintfulStudioDashboardPayload,
  PrintfulStudioDashboardMetrics,
  PrintfulStudioHealthStatus,
  PrintfulStudioSettingsSummary,
  PrintfulStudioVersion,
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

export abstract class PrintfulStudioBaseService {
  protected readonly container: any
  protected readonly version: PrintfulStudioVersion
  protected podProviderManager: PODProviderManager
  protected printfulProvider: PrintfulProvider
  protected productService: PrintfulPodProductService | null = null
  protected artworkService: ArtworkModuleService | null = null

  private artworkCache: PrintfulStudioArtwork[] | null = null
  private artworkProductIndex: Map<string, PrintfulStudioArtworkLink[]> | null = null

  constructor(container: any, version: PrintfulStudioVersion) {
    this.container = container
    this.version = version

    this.podProviderManager = this.resolveProviderManager(container)
    this.printfulProvider = this.podProviderManager.getProvider("printful") as PrintfulProvider

    if (typeof this.printfulProvider.getInternalProductService === "function") {
      this.productService = this.printfulProvider.getInternalProductService()
    }

    this.artworkService = this.resolveArtworkService(container)
  }

  abstract listCatalog(): Promise<PrintfulStudioCatalogProduct[]>

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
}
