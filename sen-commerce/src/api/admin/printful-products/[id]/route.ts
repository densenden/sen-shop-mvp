import { PrintfulPodProductService } from "../../../../modules/printful/services/printful-pod-product-service"
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

// Handle updating a single Printful product
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const { name, description } = req.body
    if (!id || !name) {
      return res.status(400).json({ error: "Missing id or name" })
    }
    // Use the service to update the product
    const service = new PrintfulPodProductService(req.scope)
    const updated = await service.updatePrintfulProduct(id, { name, description })
    if (!updated) {
      return res.status(404).json({ error: "Product not found" })
    }
    res.json({ product: updated })
  } catch (error: any) {
    console.error("Error updating Printful product:", error)
    res.status(500).json({ error: error.message || "Failed to update Printful product" })
  }
} 