import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PrintfulPodProductService } from "../../../../../modules/printful/services/printful-pod-product-service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const printfulService = new PrintfulPodProductService(req.scope)

    const products = await printfulService.fetchV1CatalogProducts()

    res.json({ products, total: products.length })
  } catch (error: any) {
    console.error("[v1-catalog] Error fetching V1 catalog:", error)
    res.status(500).json({ error: error.message })
  }
}
