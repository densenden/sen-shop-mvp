import { PrintfulPodProductService } from "../../../modules/printful/services/printful-pod-product-service"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  // Removed admin check: now any user (even not logged in) can access this endpoint
  try {
    const service = new PrintfulPodProductService(req.scope)
    const products = await service.fetchPrintfulProducts()
    res.json({ products })
  } catch (error: any) {
    console.error("Error fetching Printful products:", error)
    res.status(500).json({ error: error.message || "Failed to fetch Printful products" })
  }
} 