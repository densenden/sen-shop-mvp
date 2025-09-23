import { PrintfulStudioBaseService } from "./base-service"
import type { PrintfulStudioCatalogProduct, PrintfulStudioCatalogVariant } from "./types"

export class PrintfulStudioServiceV2 extends PrintfulStudioBaseService {
  constructor(container: any) {
    super(container, "v2")
  }

  getCapabilities(): string[] {
    return [
      "Catalog product explorer",
      "Placement-aware creator",
      "Async mockup generation",
      "Variant-level availability",
      "Advanced pricing matrix",
    ]
  }

  async listCatalog(): Promise<PrintfulStudioCatalogProduct[]> {
    if (!this.productService?.fetchCatalogProducts) {
      return []
    }

    const catalogProducts = await this.productService.fetchCatalogProducts().catch((error) => {
      console.error("[PrintfulStudioServiceV2] Failed to fetch catalog products", error)
      return []
    }) as any[]

    const catalog: PrintfulStudioCatalogProduct[] = []

    for (const product of catalogProducts) {
      const variants: PrintfulStudioCatalogVariant[] = Array.isArray(product.variants)
        ? product.variants.map((variant: any) => ({
            id: variant.id,
            name: variant.name,
            price: variant.price,
            currency: variant.currency,
            size: variant.size,
            color: variant.color,
            availability: variant.availability,
            image: variant.image,
          }))
        : []

      const linkedArtworks = await this.listArtworkLinksForProduct(product.id)

      catalog.push({
        id: product.id,
        external_id: product.id,
        version: "v2",
        source: "catalog",
        provider: "printful",
        name: product.name,
        description: product.description || null,
        thumbnail_url: product.image || null,
        variant_count: variants.length,
        variants,
        linked_artworks: linkedArtworks,
        last_synced_at: null,
        metadata: {
          category: product.category,
          brand: product.brand,
          model: product.model,
        },
      })
    }

    return catalog
  }

  protected async pingProductService(): Promise<void> {
    if (!this.productService?.fetchCatalogProducts) {
      throw new Error("Catalog product service unavailable")
    }

    await this.productService.fetchCatalogProducts()
  }
}
