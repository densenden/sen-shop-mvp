import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { DIGITAL_PRODUCT_MODULE } from "../../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../../modules/digital-product/services/digital-product-module-service"

// Simple in-memory storage for now (replace with database later)
const productDigitalProductLinks: Record<string, string[]> = {}

// GET /admin/products/:id/digital-products - Get linked digital products
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Get linked IDs from our storage
    const linkedIds = productDigitalProductLinks[id] || []
    
    // Fetch the actual digital products
    let digitalProducts: any[] = []
    if (linkedIds.length > 0) {
      digitalProducts = await digitalProductService.listDigitalProducts({
        id: linkedIds
      })
    }
    
    res.json({ 
      product_id: id,
      digital_products: digitalProducts
    })
  } catch (error) {
    console.error("Error fetching product digital products:", error)
    res.status(500).json({ 
      error: error.message || "Failed to fetch digital products" 
    })
  }
}

// POST /admin/products/:id/digital-products - Link a digital product
export const POST = async (
  req: MedusaRequest<{
    digital_product_id: string
  }>,
  res: MedusaResponse
) => {
  try {
    const { id: productId } = req.params
    const { digital_product_id } = req.body
    
    if (!digital_product_id) {
      return res.status(400).json({ error: "digital_product_id is required" })
    }
    
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Verify digital product exists
    const [digitalProduct] = await digitalProductService.listDigitalProducts({
      id: digital_product_id
    })
    
    if (!digitalProduct) {
      return res.status(404).json({ error: "Digital product not found" })
    }
    
    // Initialize array if needed
    if (!productDigitalProductLinks[productId]) {
      productDigitalProductLinks[productId] = []
    }
    
    // Add the link if not already present
    if (!productDigitalProductLinks[productId].includes(digital_product_id)) {
      productDigitalProductLinks[productId].push(digital_product_id)
    }
    
    res.json({ 
      message: "Digital product linked successfully",
      product_id: productId,
      digital_product_id: digital_product_id,
      total_linked: productDigitalProductLinks[productId].length
    })
  } catch (error) {
    console.error("Error linking digital product:", error)
    console.error("Stack trace:", error.stack)
    res.status(500).json({ 
      error: error.message || "Failed to link digital product" 
    })
  }
}

// DELETE /admin/products/:id/digital-products/:digitalProductId - Remove link
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id: productId, digitalProductId } = req.params
    
    // Remove from our storage
    if (productDigitalProductLinks[productId]) {
      productDigitalProductLinks[productId] = productDigitalProductLinks[productId].filter(
        id => id !== digitalProductId
      )
    }
    
    res.json({ 
      message: "Digital product unlinked successfully",
      product_id: productId,
      digital_product_id: digitalProductId
    })
  } catch (error) {
    console.error("Error unlinking digital product:", error)
    res.status(500).json({ 
      error: error.message || "Failed to unlink digital product" 
    })
  }
} 