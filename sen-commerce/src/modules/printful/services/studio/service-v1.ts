import { PrintfulStudioBaseService } from "./base-service"
import type {
  PrintfulStudioCatalogDetail,
  PrintfulStudioCatalogProduct,
  PrintfulStudioCatalogVariant,
  PrintfulStudioVariantAsset,
} from "./types"

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

    const syncProducts = (await this.productService.fetchSyncProducts()) as any[]
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
        price: variant.retail_price ? parseFloat(variant.retail_price) : variant.price ? Number(variant.price) : undefined,
        currency: variant.currency || product.currency || syncProductData.currency,
        size: variant.size,
        color: variant.color,
        availability: variant.availability || variant.availability_status || "template",
        image: variant.preview_url || variant.image || variant.files?.[0]?.preview_url,
        sku: variant.sku || variant.external_id,
        catalog_variant_id: this.extractCatalogVariantId(variant),
      }))

      const linkedArtworks = await this.listArtworkLinksForProduct(productId)
      const medusaSummary = await this.getMedusaProductSummary(productId)
      const assetSummary = this.buildAssetSummary(product, medusaSummary?.metadata as Record<string, unknown> | null)

      catalog.push({
        id: productId,
        external_id: product.external_id?.toString?.() ?? syncProductData.external_id?.toString?.() ?? null,
        version: "v1",
        source: "template",
        provider: "printful",
        name: syncProductData.name ?? product.name,
        description: syncProductData.description || product.description || null,
        thumbnail_url: syncProductData.thumbnail_url || product.thumbnail_url || null,
        variant_count: variants.length,
        variants,
        linked_artworks: linkedArtworks,
        last_synced_at: null,
        metadata: {
          sync_product: syncProductData,
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
    if (!this.productService?.getStoreProduct) {
      return null
    }

    const storeProduct = await this.productService.getStoreProduct(productId)
    if (!storeProduct) {
      return null
    }

    const linkedArtworks = await this.listArtworkLinksForProduct(productId)
    const medusaSummary = await this.getMedusaProductSummary(productId)

    const variantSummaries: PrintfulStudioCatalogVariant[] = Array.isArray(storeProduct.variants)
      ? storeProduct.variants.map((variant: any) => ({
          id: variant.id?.toString() ?? variant.variant_id?.toString() ?? `${productId}-variant`,
          name: variant.name || variant.sku || "Variant",
          price: variant.retail_price ? parseFloat(variant.retail_price) : variant.price ? Number(variant.price) : undefined,
          currency: variant.currency || storeProduct.currency,
          size: variant.size,
          color: variant.color,
          availability: variant.availability || variant.availability_status || null,
          image:
            variant.image ||
            variant.preview_url ||
            (Array.isArray(variant.files) && variant.files[0]
              ? variant.files[0].preview_url || variant.files[0].url
              : undefined),
          sku: variant.sku || variant.external_id,
          catalog_variant_id: this.extractCatalogVariantId(variant),
        }))
      : []

    const assetSummary = this.buildAssetSummary(storeProduct, medusaSummary?.metadata as Record<string, unknown> | null)
    const variantAssets: PrintfulStudioVariantAsset[] = this.buildVariantAssets(storeProduct)

    const catalogProduct: PrintfulStudioCatalogProduct = {
      id: productId,
      external_id: storeProduct.id?.toString?.() ?? productId,
      version: "v1",
      source: "store",
      provider: "printful",
      name: storeProduct.name,
      description: storeProduct.description || null,
      thumbnail_url: storeProduct.thumbnail_url || storeProduct.image || null,
      variant_count: variantSummaries.length,
      variants: variantSummaries,
      linked_artworks: linkedArtworks,
      last_synced_at: null,
      metadata: {
        store_product: storeProduct,
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
      product: catalogProduct,
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
        store_product: storeProduct,
      },
    }
  }

  protected async pingProductService(): Promise<void> {
    if (!this.productService?.fetchSyncProducts) {
      throw new Error("Sync product service unavailable")
    }

    await this.productService.fetchSyncProducts()
  }
}
