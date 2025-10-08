import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolvePrintfulStudioService } from "../../../../../service-resolver"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { version, productId } = req.params as { version: string; productId: string }

    console.log('[mockup-styles-route] GET request received:', {
      version,
      productId
    })

    const printfulModule = req.scope.resolve("printfulModule")
    const printfulProvider = printfulModule.getProvider("printful")
    const printfulService = printfulProvider.getInternalProductService()

    const styles = await printfulService.getMockupStyles(productId)

    console.log('[mockup-styles-route] Fetched mockup styles:', {
      product_id: productId,
      styles_count: styles.length
    })

    res.json({
      success: true,
      product_id: productId,
      styles
    })
  } catch (error: any) {
    console.error("[PrintfulStudio] mockup styles error", error)
    res.status(400).json({
      success: false,
      error: "mockup_styles_fetch_failed",
      message: error?.message ?? "Failed to fetch mockup styles",
    })
  }
}
