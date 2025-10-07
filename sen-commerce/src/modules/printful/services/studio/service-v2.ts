import { PrintfulStudioBaseService } from "./base-service"
import type {
  PrintfulStudioCatalogDetail,
  PrintfulStudioCatalogProduct,
  PrintfulStudioCatalogVariant,
  PrintfulStudioVariantAsset,
} from "./types"

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
            sku: variant.sku || variant.external_id,
            catalog_variant_id: this.extractCatalogVariantId(variant),
          }))
        : []

      const linkedArtworks = await this.listArtworkLinksForProduct(product.id)
      const medusaSummary = await this.getMedusaProductSummary(product.id)
      const assetSummary = this.buildAssetSummary(product, medusaSummary?.metadata as Record<string, unknown> | null)

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
        import_state: this.resolveImportState(medusaSummary),
        available_to_order: this.resolveAvailableToOrder(medusaSummary),
        medusa_product_id: medusaSummary?.id ?? null,
        medusa_product_status: medusaSummary?.status ?? null,
        medusa_product_handle: medusaSummary?.handle ?? null,
        primary_artwork_id: linkedArtworks.find((link) => link.is_primary)?.artwork_id ?? null,
        asset_summary: assetSummary,
      })
    }

    return catalog
  }

  async getProductDetail(productId: string): Promise<PrintfulStudioCatalogDetail | null> {
    if (!this.productService?.getCatalogProduct) {
      return null
    }

    const catalogProduct = await this.productService.getCatalogProduct(productId)
    if (!catalogProduct) {
      return null
    }

    const linkedArtworks = await this.listArtworkLinksForProduct(productId)
    const medusaSummary = await this.getMedusaProductSummary(productId)

    const variants: PrintfulStudioCatalogVariant[] = Array.isArray(catalogProduct.variants)
      ? catalogProduct.variants.map((variant: any) => ({
          id: variant.id?.toString?.() ?? `${productId}-variant`,
          name: variant.name,
          price: variant.price,
          currency: variant.currency,
          size: variant.size,
          color: variant.color,
          availability: variant.availability,
          image: variant.image,
          sku: variant.sku || variant.external_id,
          catalog_variant_id: this.extractCatalogVariantId(variant),
        }))
      : []

    const assetSummary = this.buildAssetSummary(catalogProduct, medusaSummary?.metadata as Record<string, unknown> | null)
    const variantAssets: PrintfulStudioVariantAsset[] = this.buildVariantAssets(catalogProduct)

    const catalogEntry: PrintfulStudioCatalogProduct = {
      id: productId,
      external_id: catalogProduct.id,
      version: "v2",
      source: "catalog",
      provider: "printful",
      name: catalogProduct.name,
      description: catalogProduct.description || null,
      thumbnail_url: catalogProduct.image || null,
      variant_count: variants.length,
      variants,
      linked_artworks: linkedArtworks,
      last_synced_at: null,
      metadata: {
        category: catalogProduct.category,
        brand: catalogProduct.brand,
        model: catalogProduct.model,
      },
      import_state: this.resolveImportState(medusaSummary),
      available_to_order: this.resolveAvailableToOrder(medusaSummary),
      medusa_product_id: medusaSummary?.id ?? null,
      medusa_product_status: medusaSummary?.status ?? null,
      medusa_product_handle: medusaSummary?.handle ?? null,
      primary_artwork_id: linkedArtworks.find((link) => link.is_primary)?.artwork_id ?? null,
      asset_summary: assetSummary,
    }

    return {
      product: catalogEntry,
      variants: variantAssets,
      assets: assetSummary,
      artworks: linkedArtworks,
      medusa: medusaSummary
        ? {
            id: medusaSummary.id,
            status: medusaSummary.status,
            title: medusaSummary.title,
            handle: medusaSummary.handle ?? null,
            thumbnail: medusaSummary.thumbnail ?? null,
            updated_at: medusaSummary.updated_at ?? null,
            metadata: medusaSummary.metadata ?? null,
          }
        : null,
      printful_raw: {
        catalog_product: catalogProduct,
      },
    }
  }

  protected async pingProductService(): Promise<void> {
    if (!this.productService?.fetchCatalogProducts) {
      throw new Error("Catalog product service unavailable")
    }

    await this.productService.fetchCatalogProducts()
  }
}
