import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_PRODUCT_MODULE } from "../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../modules/digital-product/services/digital-product-module-service"
import { Modules } from "@medusajs/framework/utils"

// DELETE /admin/digital-products/[id] - Delete a digital product
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const digitalProductService = req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Delete the digital product and its file
    await digitalProductService.deleteDigitalProductWithFile(id)
    
    res.json({ success: true, message: "Digital product deleted successfully" })
  } catch (error) {
    console.error("Error deleting digital product:", error)
    res.status(500).json({ error: error.message || "Failed to delete digital product" })
  }
}

// GET /admin/digital-products/[id] - Get a specific digital product
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id } = req.params
    const digitalProductService = req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    const [digitalProduct] = await digitalProductService.listDigitalProducts({
      id
    })
    
    if (!digitalProduct) {
      return res.status(404).json({ error: "Digital product not found" })
    }
    
    res.json({ digital_product: digitalProduct })
  } catch (error) {
    console.error("Error fetching digital product:", error)
    res.status(500).json({ error: error.message || "Failed to fetch digital product" })
  }
}