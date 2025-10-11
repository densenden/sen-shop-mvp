import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PrintfulPodProductService } from "../../../../../../modules/printful/services/printful-pod-product-service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { productId } = req.params

  try {
    const printfulService = new PrintfulPodProductService(req.scope)
    const product = await printfulService.getV1Product(productId)

    res.json({ product })
  } catch (error: any) {
    console.error(`[v1-catalog] Error fetching V1 product ${productId}:`, error)
    res.status(500).json({ error: error.message })
  }
}
