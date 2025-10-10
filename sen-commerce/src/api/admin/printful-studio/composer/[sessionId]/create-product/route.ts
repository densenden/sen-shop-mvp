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
            type: 'default'  // File type must be 'default' or 'mockup', not placement value
          }] : []
        }
      })

      // Create a map of catalog_variant_id -> retail_price for later lookup
      const catalogVariantPriceMap = new Map<string, number>()
      session.product.selected_variant_ids.forEach((variantId) => {
        const price = session.pricing!.retail_prices[variantId]
        if (price) {
          catalogVariantPriceMap.set(String(variantId), price)
        }
      })

      console.log('[create-product] Creating sync product with:', {
        name: session.details.product_title,
        variant_count: variantsData.length,
        variants: variantsData,
        printful_file_id: printfulFileId,
        price_map: Object.fromEntries(catalogVariantPriceMap),
        session_pricing: session.pricing,
        selected_variant_ids: session.product.selected_variant_ids
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

      // Step 3: Use mockups generated during preview step
      let mockupUrls: string[] = []

      // ALWAYS use the mockups from the preview step - they were generated progressively
      if (session.mockups?.mockup_urls && session.mockups.mockup_urls.length > 0) {
        mockupUrls = session.mockups.mockup_urls
        console.log('[create-product] Using pre-generated mockups from preview:', mockupUrls.length)
      } else if (session.artwork.artwork_url && session.product.selected_variant_ids.length > 0) {
        // Fallback: Only generate if no mockups were created in preview
        console.log('[create-product] No preview mockups found, generating new ones...')
        try {
          const placement = session.design?.placement
          const technique = session.design?.technique
          const mockupStyleIds = session.design?.mockup_style_ids

          console.log('[create-product] Generating mockups for:', {
            catalog_product_id: session.product.catalog_product_id,
            variant_count: session.product.selected_variant_ids.length,
            variant_ids: session.product.selected_variant_ids,
            placement,
            technique,
            mockup_style_ids: mockupStyleIds || 'auto-select',
            style_count: mockupStyleIds?.length || 'auto'
          })

          mockupUrls = await printfulService.generateAndWaitForMockups(
            session.product.catalog_product_id,
            session.product.selected_variant_ids,
            session.artwork.artwork_url,
            90000, // 90 second timeout for multiple variants
            placement,
            technique,
            mockupStyleIds ? mockupStyleIds.map(String) : undefined,
            undefined // productOptions
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
          console.log('[create-product] Starting Medusa import for product:', result.printful_product_id)

          // Fetch the full product with all variants
          const fullProduct = await printfulService.getStoreProduct(result.printful_product_id)
          console.log('[create-product] Fetched full product:', {
            id: fullProduct?.id,
            name: fullProduct?.name,
            variant_count: fullProduct?.variants?.length
          })

          if (fullProduct) {
            // Import using Medusa v2 API
            const { Modules } = await import("@medusajs/framework/utils")
            const productModule = req.scope.resolve(Modules.PRODUCT)

            // Collect all images: mockups + watermarked artwork (no original print files)
            const images: string[] = []
            let mockupCount = 0

            // Add mockups first (all selected mockups)
            if (mockupUrls.length > 0) {
              images.push(...mockupUrls)
              mockupCount = mockupUrls.length
              console.log('[create-product] Added mockups to images:', mockupCount)
            }

            // Add watermarked artwork URL (NOT original print file)
            if (session.artwork.artwork_id) {
              const baseUrl = `${req.protocol}://${req.get('host')}`
              const watermarkedArtworkUrl = `${baseUrl}/admin/artworks/${session.artwork.artwork_id}/watermark`
              images.push(watermarkedArtworkUrl)
              console.log('[create-product] Added watermarked artwork:', watermarkedArtworkUrl)
            }

            console.log('[create-product] Final images collection:', {
              total: images.length,
              mockups: mockupCount,
              watermarked_artwork: session.artwork.artwork_id ? 1 : 0
            })

            console.log('[create-product] Creating Medusa product with:', {
              title: session.details.product_title,
              images_count: images.length,
              mockups: mockupCount,
              watermarked_artwork: session.artwork.artwork_id ? 1 : 0,
              variant_count: fullProduct.variants?.length || 0
            })

            // Create variants data from Printful product
            const variantData = (fullProduct.variants || []).map((variant: any, idx: number) => {
              // Printful sync variants have a variant_id field that references the catalog variant
              const catalogVariantId = String(variant.variant_id || variant.id)
              const syncVariantId = String(variant.id)

              // Look up price by catalog variant ID
              let retailPrice = "25.00"

              if (catalogVariantPriceMap.has(catalogVariantId)) {
                retailPrice = String(catalogVariantPriceMap.get(catalogVariantId))
              } else if (variant.retail_price) {
                retailPrice = String(variant.retail_price)
              } else if (variant.price) {
                retailPrice = String(variant.price)
              }

              const priceInCents = Math.round(parseFloat(retailPrice) * 100)

              console.log(`[create-product] Variant ${idx}:`, {
                sync_variant_id: syncVariantId,
                catalog_variant_id: catalogVariantId,
                price_from_map: catalogVariantPriceMap.get(catalogVariantId),
                variant_retail_price: variant.retail_price,
                variant_price: variant.price,
                final_retail_price: retailPrice,
                price_in_cents: priceInCents,
                name: variant.name
              })

              return {
                title: variant.name || `Variant ${idx + 1}`,
                sku: variant.sku || `printful-${variant.id}`,
                prices: [{
                  amount: priceInCents,
                  currency_code: session.pricing?.currency?.toLowerCase() || 'usd'
                }],
                metadata: {
                  printful_variant_id: variant.id,
                  printful_sync_variant_id: variant.sync_variant_id,
                  size: variant.size || undefined,
                  color: variant.color || undefined
                }
              }
            })

            console.log('[create-product] Creating with variants:', variantData.length)

            // Create Medusa product with variants (createProducts returns array)
            const medusaProducts = await productModule.createProducts([{
              title: session.details.product_title,
              description: session.details.product_description || '',
              status: medusa_status,
              thumbnail: images[0] || null,
              images: images.slice(0, 20).map(url => ({ url })),
              variants: variantData,
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
                  watermarked_artwork: session.artwork.artwork_id ? 1 : 0,
                  original_print_file: 0  // Never included
                }
              }
            }])

            const medusaProduct = medusaProducts[0]

            console.log('[create-product] Medusa product created:', {
              id: medusaProduct.id,
              title: medusaProduct.title,
              variants: medusaProduct.variants?.length || 0
            })

            result.medusa_product_id = medusaProduct.id
            result.medusa_product = medusaProduct

            // Link artwork to product by updating product_ids array
            const artworkId = session.artwork?.artwork_id

            console.log('[create-product] Artwork linking check:', {
              artwork_id: artworkId,
              artwork_id_type: typeof artworkId,
              artwork_id_truthy: !!artworkId,
              medusa_product_id: medusaProduct.id,
              session_artwork: session.artwork
            })

            if (artworkId && artworkId !== '' && medusaProduct.id) {
              try {
                const artworkService = req.scope.resolve("artworkModuleService")

                // Get current artwork to read existing product_ids
                const artwork = await artworkService.retrieveArtwork(artworkId)
                const currentProductIds = Array.isArray(artwork.product_ids) ? artwork.product_ids : []

                console.log('[create-product] Current artwork product_ids:', currentProductIds)

                // Add new Medusa product ID if not already present
                if (!currentProductIds.includes(medusaProduct.id)) {
                  await artworkService.updateArtworks({
                    id: artworkId,
                    product_ids: [...currentProductIds, medusaProduct.id],
                    product_name: medusaProduct.title // Store product name in artwork
                  })
                  console.log('[create-product] ✅ Linked artwork to Medusa product:', {
                    artwork_id: artworkId,
                    product_id: medusaProduct.id,
                    product_name: medusaProduct.title,
                    new_product_ids: [...currentProductIds, medusaProduct.id]
                  })
                } else {
                  // Update product_name even if already linked
                  await artworkService.updateArtworks({
                    id: artworkId,
                    product_name: medusaProduct.title
                  })
                  console.log('[create-product] Product already linked to artwork, updated product_name')
                }
              } catch (error) {
                console.error('[create-product] ❌ Failed to link artwork to product:', error)
              }
            } else {
              console.warn('[create-product] ⚠️  Skipping artwork linking - artwork_id is missing or empty:', {
                artwork_id: artworkId,
                has_medusa_product: !!medusaProduct.id
              })
            }
          }
        } catch (error: any) {
          console.error('[create-product] Medusa import error:', error)
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
