import { PrintfulStudioBaseService } from "./base-service"
import type { PrintfulStudioCatalogProduct, PrintfulStudioCatalogVariant } from "./types"

export class PrintfulStudioServiceV1 extends PrintfulStudioBaseService {
  constructor(container: any) {
    super(container, "v1")
  }

  getCapabilities(): string[] {
    return [
      "Store product sync",
      "Template-based creation",
      "Manual pricing overrides",
      "Legacy webhook processing",
      "Catalog importer",
    ]
  }

  async listCatalog(): Promise<PrintfulStudioCatalogProduct[]> {
    if (!this.productService?.fetchSyncProducts) {
      return []
    }

    const syncProducts = await this.productService.fetchSyncProducts() as any[]
    const catalog: PrintfulStudioCatalogProduct[] = []

    for (const product of syncProducts) {
      const syncProductData = product.sync_product ?? product
      const productId = syncProductData.id?.toString?.() ?? product.id?.toString?.() ?? String(product.id)

      const variantsSource = Array.isArray(product.sync_variants)
        ? product.sync_variants
        : Array.isArray(syncProductData.sync_variants)
          ? syncProductData.sync_variants
          : Array.isArray(syncProductData.variants)
            ? syncProductData.variants
            : []

      const variants: PrintfulStudioCatalogVariant[] = variantsSource.map((variant: any) => ({
        id: variant.id?.toString() ?? variant.external_id ?? `${productId}-variant`,
        name: variant.name || variant.sku || "Variant",
        price: variant.retail_price ? parseFloat(variant.retail_price) : undefined,
        currency: variant.currency || product.currency || syncProductData.currency,
        size: variant.size,
        color: variant.color,
        availability: "template",
        image: variant.preview_url || variant.image || variant.files?.[0]?.preview_url,
      }))

      const linkedArtworks = await this.listArtworkLinksForProduct(productId)

      catalog.push({
        id: productId,
        external_id: product.external_id?.toString?.() ?? syncProductData.external_id?.toString?.() ?? null,
        version: "v1",
        source: "template",
        provider: "printful",
        name: syncProductData.name ?? product.name,
        description:
          syncProductData.description ||
          product.description ||
          null,
        thumbnail_url:
          syncProductData.thumbnail_url ||
          product.thumbnail_url ||
          null,
        variant_count: variants.length,
        variants,
        linked_artworks: linkedArtworks,
        last_synced_at: null,
        metadata: {
          sync_product: syncProductData,
        },
      })
    }

    return catalog
  }

  protected async pingProductService(): Promise<void> {
    if (!this.productService?.fetchSyncProducts) {
      throw new Error("Sync product service unavailable")
    }

    await this.productService.fetchSyncProducts()
  }
}
