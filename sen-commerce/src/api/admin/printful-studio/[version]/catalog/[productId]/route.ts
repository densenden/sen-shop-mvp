import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolvePrintfulStudioService } from "../../../service-resolver"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { version, productId } = req.params as { version: string; productId: string }
    const service = resolvePrintfulStudioService(req, version)
    const detail = await service.getProductDetail(productId)

    if (!detail) {
      return res.status(404).json({
        error: "printful_product_not_found",
        message: `Printful product '${productId}' not found for ${version}`,
      })
    }

    res.json(detail)
  } catch (error: any) {
    console.error("[PrintfulStudio] catalog detail error", error)
    res.status(400).json({
      error: "catalog_detail_error",
      message: error?.message ?? "Failed to load catalog detail",
    })
  }
}
