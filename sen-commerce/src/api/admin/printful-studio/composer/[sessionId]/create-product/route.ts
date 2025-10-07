import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type {
  PrintfulStudioComposerData,
  PrintfulStudioCreateProductResult
} from "../../../../../../modules/printful/services/studio/types"

declare global {
  var __printful_studio_composer_sessions: Map<string, PrintfulStudioComposerData> | undefined
}

if (!global.__printful_studio_composer_sessions) {
  global.__printful_studio_composer_sessions = new Map()
}

const composerSessions = global.__printful_studio_composer_sessions

/**
 * POST /admin/printful-studio/composer/:sessionId/create-product
 * Create product on Printful and optionally import to Medusa
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const sessionId = req.params.sessionId

    console.log('[create-product] Session ID:', sessionId)
    console.log('[create-product] Available sessions:', Array.from(composerSessions.keys()))

    const { auto_import_to_medusa = true, medusa_status = 'draft' } = req.body as {
      auto_import_to_medusa?: boolean
      medusa_status?: 'draft' | 'published'
    }

    const session = composerSessions.get(sessionId)

    if (!session) {
      return res.status(404).json({
        message: "Composer session not found",
        session_id: sessionId,
        available_sessions: Array.from(composerSessions.keys())
      })
    }

    // Validate session is ready to create product
    if (!session.product || !session.details || !session.pricing) {
      return res.status(400).json({
        message: "Session is not complete. Missing product, details, or pricing configuration.",
        current_state: session.state
      })
    }

    if (!session.artwork.artwork_url && !session.artwork.printful_file_id) {
      return res.status(400).json({
        message: "Artwork is required to create a product"
      })
    }

    if (!session.product.selected_variant_ids || session.product.selected_variant_ids.length === 0) {
      return res.status(400).json({
        message: "At least one product variant must be selected",
        current_state: session.state
      })
    }

    // Update session state
    session.state = 'creating'
    session.updated_at = new Date().toISOString()
    composerSessions.set(sessionId, session)

    const result: PrintfulStudioCreateProductResult = {
      success: false,
      errors: []
    }

    try {
      // Step 1: Upload artwork to Printful if not already uploaded
      let printfulFileId = session.artwork.printful_file_id

      if (!printfulFileId && session.artwork.artwork_url) {
        try {
          const printfulModule = req.scope.resolve("printfulModule")
          const printfulProvider = printfulModule.getProvider("printful")
          const printfulService = printfulProvider.getInternalProductService()

          const uploadResult = await printfulService.uploadArtworkToPrintful(
            session.artwork.artwork_url,
            session.artwork.artwork_title || undefined
          )

          printfulFileId = uploadResult.id
          session.artwork.printful_file_id = printfulFileId
        } catch (error: any) {
          result.errors?.push(`Failed to upload artwork to Printful: ${error.message}`)
          throw error
        }
      }

      // Step 2: Create sync product on Printful
      const printfulModule = req.scope.resolve("printfulModule")
      const printfulProvider = printfulModule.getProvider("printful")
      const printfulService = printfulProvider.getInternalProductService()

      console.log('[create-product] Session product data:', {
        catalog_product_id: session.product.catalog_product_id,
        selected_variant_ids: session.product.selected_variant_ids,
        pricing_data: session.pricing
      })

      // Use placement from design settings, or default to 'default'
      const placement = session.design?.placement || 'default'

      console.log('[create-product] Placement value:', {
        from_session: session.design?.placement,
        final_placement: placement,
        placement_type: typeof placement
      })

      const variantsData = session.product.selected_variant_ids.map((variantId) => {
        const retailPrice = session.pricing!.retail_prices[variantId]

        return {
          variant_id: parseInt(variantId, 10),
          retail_price: retailPrice?.toFixed(2) || "25.00",
          files: printfulFileId ? [{
            id: printfulFileId,
            type: placement
          }] : []
        }
      })

      console.log('[create-product] Creating sync product with:', {
        name: session.details.product_title,
        variant_count: variantsData.length,
        variants: variantsData,
        printful_file_id: printfulFileId
      })

      if (variantsData.length === 0) {
        throw new Error('No variants data - selected_variant_ids may be empty or invalid')
      }

      let syncProduct
      try {
        syncProduct = await printfulService.createSyncProduct({
          name: session.details.product_title,
          description: session.details.product_description || undefined,
          thumbnail_url: session.artwork.artwork_url || undefined,
          variants: variantsData
        })
        console.log('[create-product] Sync product created successfully:', syncProduct.sync_product?.id || syncProduct.id)
      } catch (printfulError: any) {
        console.error('[create-product] Printful API error:', {
          message: printfulError.message,
          status: printfulError.status,
          response: printfulError.response
        })
        throw new Error(`Printful API rejected the product: ${printfulError.message}`)
      }

      result.printful_product_id = syncProduct.sync_product?.id?.toString() || syncProduct.id?.toString()
      result.sync_product = syncProduct

      // Step 3: Generate mockups for ALL selected variants
      let mockupUrls: string[] = []
      if (session.mockups?.mockup_urls && session.mockups.mockup_urls.length > 0) {
        mockupUrls = session.mockups.mockup_urls
        console.log('[create-product] Using pre-generated mockups:', mockupUrls.length)
      } else if (session.artwork.artwork_url && session.product.selected_variant_ids.length > 0) {
        try {
          const placement = session.design?.placement
          const technique = session.design?.technique

          console.log('[create-product] Generating mockups for:', {
            catalog_product_id: session.product.catalog_product_id,
            variant_count: session.product.selected_variant_ids.length,
            variant_ids: session.product.selected_variant_ids,
            placement,
            technique
          })

          mockupUrls = await printfulService.generateAndWaitForMockups(
            session.product.catalog_product_id,
            session.product.selected_variant_ids,
            session.artwork.artwork_url,
            90000, // 90 second timeout for multiple variants
            placement,
            technique
          )

          console.log('[create-product] Generated mockups:', {
            count: mockupUrls.length,
            expected: session.product.selected_variant_ids.length,
            urls: mockupUrls
          })

          // Warn if we got fewer mockups than variants
          if (mockupUrls.length < session.product.selected_variant_ids.length) {
            result.errors?.push(`Warning: Only generated ${mockupUrls.length} mockups out of ${session.product.selected_variant_ids.length} variants`)
          }
        } catch (error: any) {
          console.warn('[create-product] Failed to generate mockups:', error.message)
          result.errors?.push(`Warning: Mockup generation failed: ${error.message}`)
          // Continue without mockups
        }
      }

      // Step 4: Optionally import to Medusa
      if (auto_import_to_medusa && result.printful_product_id) {
        try {
          // Fetch the full product with all variants
          const fullProduct = await printfulService.getStoreProduct(result.printful_product_id)

          if (fullProduct) {
            // Import using the existing importer logic
            const productModule = req.scope.resolve("productService")
            const fileModule = req.scope.resolve("fileService")

            // Collect all images
            const images: string[] = []
            let mockupCount = 0
            let variantCount = 0

            // Add mockups first (primary images)
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

            // Create Medusa product
            const medusaProduct = await productModule.createProducts({
              title: session.details.product_title,
              description: session.details.product_description || '',
              status: medusa_status,
              thumbnail: images[0] || null,
              images: images.slice(0, 20).map(url => ({ url })), // Limit to 20 images
              metadata: {
                printful_product_id: result.printful_product_id,
                printful_api_version: 'v1',
                fulfillment_type: 'printful_pod',
                artwork_id: session.artwork.artwork_id,
                catalog_product_id: session.product.catalog_product_id,
                total_images: images.length,
                created_via: 'printful_studio_composer',
                image_sources: {
                  mockups: mockupCount,
                  variants: variantCount,
                  catalog: images.length - mockupCount - variantCount
                }
              }
            })

            result.medusa_product_id = medusaProduct.id
            result.medusa_product = medusaProduct

            // Link artwork to product
            if (session.artwork.artwork_id) {
              try {
                const artworkService = req.scope.resolve("artworkModuleService")
                await artworkService.createArtworkProductRelation({
                  artwork_id: session.artwork.artwork_id,
                  product_id: result.printful_product_id,
                  product_type: 'printful_pod',
                  is_primary: true
                })
              } catch (error) {
                console.warn('Failed to link artwork to product:', error)
              }
            }
          }
        } catch (error: any) {
          result.errors?.push(`Failed to import to Medusa: ${error.message}`)
        }
      }

      result.success = true
      session.state = 'completed'
    } catch (error: any) {
      session.state = 'failed'
      result.errors?.push(error.message)
    }

    session.updated_at = new Date().toISOString()
    composerSessions.set(sessionId, session)

    if (result.success) {
      res.json(result)
    } else {
      res.status(500).json(result)
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message
    })
  }
}
