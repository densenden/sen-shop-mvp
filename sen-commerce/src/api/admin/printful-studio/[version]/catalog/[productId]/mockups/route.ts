import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolvePrintfulStudioService } from "../../../../service-resolver"
import { ProductImageService } from "../../../../../../../services/product-image-service"

interface MockupRequestPayload {
  variant_ids?: string[]
  artwork_id?: string
  artwork_url?: string
  mockup_style_ids?: (string | number)[]
  product_options?: Record<string, string>
  max_mockups?: number
  wait_for_completion?: boolean
  upload_to_medusa?: boolean
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { version, productId } = req.params as { version: string; productId: string }
    const body = (req.body || {}) as MockupRequestPayload

    console.log('[mockups-route] POST request received:', {
      version,
      productId,
      body
    })

    const variantIds = Array.isArray(body.variant_ids)
      ? body.variant_ids.filter((id) => typeof id === "string" && id.trim().length > 0)
      : undefined

    const mockupStyleIds = Array.isArray(body.mockup_style_ids)
      ? body.mockup_style_ids.filter((id) => (typeof id === "string" && id.trim().length > 0) || typeof id === "number")
      : undefined

    console.log('[mockups-route] Resolved variant IDs:', variantIds)
    console.log('[mockups-route] Resolved mockup style IDs:', mockupStyleIds)
    console.log('[mockups-route] Product options:', body.product_options)

    const service = resolvePrintfulStudioService(req, version)
    const mockupResult = await service.generateMockups({
      productId,
      variantIds,
      artworkId: body.artwork_id,
      artworkUrl: body.artwork_url,
      mockupStyleIds,
      productOptions: body.product_options,
      maxMockups: body.max_mockups,
      waitForCompletion: body.wait_for_completion !== false,
    })

    console.log('[mockups-route] Mockup generation result:', {
      mockup_count: mockupResult.mockup_urls.length,
      variant_count: mockupResult.variant_ids.length
    })

    const shouldUpload = body.upload_to_medusa !== false
    const medusaUrls: string[] = []
    const uploadErrors: string[] = []

    if (shouldUpload && mockupResult.mockup_urls.length) {
      const imageService = new ProductImageService(req)

      for (const url of mockupResult.mockup_urls) {
        try {
          const uploadedUrl = await imageService.downloadAndUploadImage(url)
          if (uploadedUrl) {
            medusaUrls.push(uploadedUrl)
          }
        } catch (error: any) {
          console.error(`[PrintfulStudio] Failed to upload mockup ${url}`, error)
          uploadErrors.push(error?.message ?? `Failed to upload ${url}`)
        }
      }
    }

    res.json({
      success: true,
      product_id: mockupResult.product_id,
      variant_ids: mockupResult.variant_ids,
      artwork: mockupResult.artwork,
      mockup_urls: mockupResult.mockup_urls,
      medusa_urls: medusaUrls,
      upload_errors: uploadErrors,
    })
  } catch (error: any) {
    console.error("[PrintfulStudio] mockup generation error", error)
    res.status(400).json({
      success: false,
      error: "mockup_generation_failed",
      message: error?.message ?? "Failed to generate mockups",
    })
  }
}
