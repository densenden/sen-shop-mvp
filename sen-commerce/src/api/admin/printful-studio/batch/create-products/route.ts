import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type {
  PrintfulStudioBatchCreateRequest,
  PrintfulStudioBatchCreateResult
} from "../../../../../modules/printful/services/studio/types"

/**
 * POST /admin/printful-studio/batch/create-products
 * Batch create products from multiple artworks and catalog products
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const {
      artwork_ids,
      catalog_product_ids,
      auto_generate_mockups = false,
      auto_import_to_medusa = true,
      pricing_config
    } = req.body as PrintfulStudioBatchCreateRequest

    if (!artwork_ids || !Array.isArray(artwork_ids) || artwork_ids.length === 0) {
      return res.status(400).json({
        message: "artwork_ids array is required"
      })
    }

    if (!catalog_product_ids || !Array.isArray(catalog_product_ids) || catalog_product_ids.length === 0) {
      return res.status(400).json({
        message: "catalog_product_ids array is required"
      })
    }

    const result: PrintfulStudioBatchCreateResult = {
      total: artwork_ids.length * catalog_product_ids.length,
      created: 0,
      failed: 0,
      results: []
    }

    // Resolve services
    const printfulModule = req.scope.resolve("printfulModule")
    const printfulProvider = printfulModule.getProvider("printful")
    const printfulService = printfulProvider.getInternalProductService()
    const artworkService = req.scope.resolve("artworkModuleService")
    const productService = req.scope.resolve("productService")

    // Fetch artworks
    const artworks = await artworkService.listArtworks(
      { id: artwork_ids },
      { limit: artwork_ids.length }
    )

    const artworkMap = new Map(artworks.map((a: any) => [a.id, a]))

    // Process each combination
    for (const artworkId of artwork_ids) {
      const artwork = artworkMap.get(artworkId)

      if (!artwork) {
        for (const catalogProductId of catalog_product_ids) {
          result.results.push({
            artwork_id: artworkId,
            catalog_product_id: catalogProductId,
            success: false,
            error: "Artwork not found"
          })
          result.failed++
        }
        continue
      }

      for (const catalogProductId of catalog_product_ids) {
        try {
          // Upload artwork to Printful
          let printfulFileId: string | null = null

          if (artwork.image_url) {
            try {
              const uploadResult = await printfulService.uploadArtworkToPrintful(
                artwork.image_url,
                artwork.title
              )
              printfulFileId = uploadResult.id
            } catch (error: any) {
              result.results.push({
                artwork_id: artworkId,
                catalog_product_id: catalogProductId,
                success: false,
                error: `Failed to upload artwork: ${error.message}`
              })
              result.failed++
              continue
            }
          }

          // Fetch catalog product variants
          const catalogProduct = await printfulService.getCatalogProduct(catalogProductId)

          if (!catalogProduct || !catalogProduct.variants || catalogProduct.variants.length === 0) {
            result.results.push({
              artwork_id: artworkId,
              catalog_product_id: catalogProductId,
              success: false,
              error: "Catalog product not found or has no variants"
            })
            result.failed++
            continue
          }

          // Calculate pricing
          const markupType = pricing_config?.markup_type || 'percentage'
          const markupValue = pricing_config?.markup_value || 50

          const variantsData = catalogProduct.variants.map((variant: any) => {
            const baseCost = variant.price || 20
            let retailPrice = baseCost

            if (markupType === 'percentage') {
              retailPrice = baseCost * (1 + markupValue / 100)
            } else {
              retailPrice = baseCost + markupValue
            }

            return {
              variant_id: parseInt(variant.id, 10),
              retail_price: retailPrice.toFixed(2),
              files: printfulFileId ? [{
                id: printfulFileId,
                type: 'default'  // File type must be 'default' or 'mockup', not placement value
              }] : []
            }
          })

          // Create sync product on Printful
          const productName = `${artwork.title} - ${catalogProduct.name}`
          const syncProduct = await printfulService.createSyncProduct({
            name: productName,
            description: artwork.description || catalogProduct.description,
            thumbnail_url: artwork.image_url || undefined,
            variants: variantsData
          })

          const printfulProductId = syncProduct.sync_product?.id?.toString() || syncProduct.id?.toString()

          let medusaProductId: string | null = null

          // Generate mockups if requested
          let mockupUrls: string[] = []
          if (auto_generate_mockups && artwork.image_url && catalogProduct.variants.length > 0) {
            try {
              const variantIds = catalogProduct.variants.slice(0, 5).map((v: any) => v.id) // Limit to first 5 variants
              mockupUrls = await printfulService.generateAndWaitForMockups(
                catalogProductId,
                variantIds,
                artwork.image_url,
                60000 // 60 second timeout
              )
            } catch (error: any) {
              console.warn('[batch-create] Failed to generate mockups:', error.message)
              // Continue without mockups
            }
          }

          // Import to Medusa if requested
          if (auto_import_to_medusa && printfulProductId) {
            try {
              const fullProduct = await printfulService.getStoreProduct(printfulProductId)

              if (fullProduct) {
                const images: string[] = []
                let mockupCount = 0
                let variantCount = 0

                // Add mockups first
                if (mockupUrls.length > 0) {
                  images.push(...mockupUrls)
                  mockupCount = mockupUrls.length
                }

                // Add product thumbnail
                if (fullProduct.thumbnail_url && !images.includes(fullProduct.thumbnail_url)) {
                  images.push(fullProduct.thumbnail_url)
                }

                // Add variant images
                if (Array.isArray(fullProduct.variants)) {
                  fullProduct.variants.forEach((variant: any) => {
                    if (variant.image && !images.includes(variant.image)) {
                      images.push(variant.image)
                      variantCount++
                    }
                    if (Array.isArray(variant.files)) {
                      variant.files.forEach((file: any) => {
                        const url = file.preview_url || file.thumbnail_url || file.url
                        if (url && !images.includes(url)) {
                          images.push(url)
                          variantCount++
                        }
                      })
                    }
                  })
                }

                const medusaProduct = await productService.createProducts({
                  title: productName,
                  description: artwork.description || catalogProduct.description || '',
                  status: 'draft',
                  thumbnail: images[0] || null,
                  images: images.slice(0, 20).map(url => ({ url })),
                  metadata: {
                    printful_product_id: printfulProductId,
                    printful_api_version: 'v1',
                    fulfillment_type: 'printful_pod',
                    artwork_id: artworkId,
                    catalog_product_id: catalogProductId,
                    total_images: images.length,
                    created_via: 'printful_studio_batch',
                    image_sources: {
                      mockups: mockupCount,
                      variants: variantCount,
                      catalog: images.length - mockupCount - variantCount
                    }
                  }
                })

                medusaProductId = medusaProduct.id

                // Link artwork to product
                try {
                  await artworkService.createArtworkProductRelation({
                    artwork_id: artworkId,
                    product_id: printfulProductId,
                    product_type: 'printful_pod',
                    is_primary: true
                  })
                } catch (error) {
                  console.warn('Failed to link artwork:', error)
                }
              }
            } catch (error: any) {
              console.warn('Failed to import to Medusa:', error)
            }
          }

          result.results.push({
            artwork_id: artworkId,
            catalog_product_id: catalogProductId,
            success: true,
            printful_product_id: printfulProductId,
            medusa_product_id: medusaProductId
          })
          result.created++
        } catch (error: any) {
          result.results.push({
            artwork_id: artworkId,
            catalog_product_id: catalogProductId,
            success: false,
            error: error.message
          })
          result.failed++
        }
      }
    }

    res.json(result)
  } catch (error: any) {
    res.status(500).json({
      message: "Batch product creation failed",
      error: error.message
    })
  }
}
