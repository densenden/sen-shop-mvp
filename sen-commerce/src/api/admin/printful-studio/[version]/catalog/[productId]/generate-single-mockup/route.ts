import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRINTFUL_MODULE } from "../../../../../../../modules/printful"

/**
 * POST /admin/printful-studio/v2/catalog/:productId/generate-single-mockup
 *
 * Generates a single mockup for one variant + one style combination.
 * This allows progressive generation to respect rate limits and show real-time progress.
 *
 * Body: {
 *   variant_id: string
 *   style_id: string
 *   artwork_url: string
 *   placement?: string
 *   technique?: string
 *   product_options?: Record<string, string>
 * }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { productId } = req.params
    const { variant_id, style_id, artwork_url, placement, technique, product_options } = req.body as {
      variant_id: string
      style_id: string
      artwork_url: string
      placement?: string
      technique?: string
      product_options?: Record<string, string>
    }

    if (!productId || !variant_id || !style_id || !artwork_url) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["productId", "variant_id", "style_id", "artwork_url"]
      })
    }

    const printfulService = req.scope.resolve(PRINTFUL_MODULE)

    console.log(`[Single Mockup] Generating: Product ${productId}, Variant ${variant_id}, Style ${style_id}`)

    // Generate mockup for this single combination
    const mockupUrls = await printfulService.generateAndWaitForMockups(
      productId,
      [variant_id], // Single variant
      artwork_url,
      placement,
      technique,
      [style_id], // Single style
      product_options
    )

    if (mockupUrls.length === 0) {
      console.log(`[Single Mockup] No mockup generated - style ${style_id} likely incompatible with variant ${variant_id}`)
      return res.json({
        success: false,
        compatible: false,
        mockup_url: null,
        message: `Style ${style_id} is not compatible with this variant`
      })
    }

    console.log(`[Single Mockup] Generated successfully: ${mockupUrls[0]}`)

    return res.json({
      success: true,
      compatible: true,
      mockup_url: mockupUrls[0],
      variant_id,
      style_id
    })

  } catch (error) {
    console.error("[Single Mockup] Error:", error)

    // Check for rate limit error
    if (error.message && error.message.includes('Rate limit')) {
      const waitSeconds = error.message.match(/(\d+) seconds/)?.[1] || '60'
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: error.message,
        wait_seconds: parseInt(waitSeconds, 10),
        retry_after: parseInt(waitSeconds, 10)
      })
    }

    return res.status(500).json({
      error: "Failed to generate mockup",
      message: error.message
    })
  }
}
