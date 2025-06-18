import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_PRODUCT_MODULE } from "../../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../../modules/digital-product/services/digital-product-module-service"
import { Modules } from "@medusajs/framework/utils"

// POST /admin/products/:id/digital-products - Link digital products to a product
export const POST = async (
  req: MedusaRequest<{
    digital_product_ids: string[]
  }>,
  res: MedusaResponse
) => {
  try {
    const productId = req.params.id
    const { digital_product_ids } = req.body
    
    if (!digital_product_ids || !Array.isArray(digital_product_ids)) {
      return res.status(400).json({ 
        error: "digital_product_ids must be an array" 
      })
    }
    
    // Get remote link service to create links
    const remoteLink: any = req.scope.resolve(Modules.LINK)
    
    // Create links between product and digital products
    const links = digital_product_ids.map(digitalProductId => ({
      product_id: productId,
      digital_product_id: digitalProductId
    }))
    
    await remoteLink.create(links)
    
    res.json({
      message: "Digital products linked successfully",
      product_id: productId,
      digital_product_ids
    })
  } catch (error) {
    console.error("Error linking digital products:", error)
    res.status(500).json({ 
      error: error.message || "Failed to link digital products" 
    })
  }
}

// DELETE /admin/products/:id/digital-products - Unlink digital products from a product
export const DELETE = async (
  req: MedusaRequest<{
    digital_product_ids: string[]
  }>,
  res: MedusaResponse
) => {
  try {
    const productId = req.params.id
    const { digital_product_ids } = req.body
    
    if (!digital_product_ids || !Array.isArray(digital_product_ids)) {
      return res.status(400).json({ 
        error: "digital_product_ids must be an array" 
      })
    }
    
    // Get remote link service
    const remoteLink: any = req.scope.resolve(Modules.LINK)
    
    // Remove links
    for (const digitalProductId of digital_product_ids) {
      await remoteLink.delete({
        product_id: productId,
        digital_product_id: digitalProductId
      })
    }
    
    res.json({
      message: "Digital products unlinked successfully",
      product_id: productId,
      digital_product_ids
    })
  } catch (error) {
    console.error("Error unlinking digital products:", error)
    res.status(500).json({ 
      error: error.message || "Failed to unlink digital products" 
    })
  }
} 