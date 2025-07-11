import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DIGITAL_PRODUCT_MODULE } from "../../../../modules/digital-product"
import type { DigitalProductModuleService } from "../../../../modules/digital-product/services/digital-product-module-service"

// GET /admin/digital-products/:id - Get a single digital product
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    console.log("Requested digital product id:", id)
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    const [digitalProduct] = await digitalProductService.listDigitalProducts({ id })
    console.log("Result from listDigitalProducts:", digitalProduct)
    
    if (!digitalProduct) {
      return res.status(404).json({ error: "Digital product not found" })
    }
    
    res.json({ digital_product: digitalProduct })
  } catch (error) {
    console.error("Error fetching digital product:", error)
    res.status(500).json({ 
      error: error.message || "Failed to fetch digital product" 
    })
  }
}

// PUT /admin/digital-products/:id - Update a digital product
export const PUT = async (
  req: MedusaRequest<{
    name?: string
    description?: string
    max_downloads?: number
    printful_product_ids?: string[]
  }>,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Update the digital product  
    const updateData: any = { ...req.body }
    await digitalProductService.updateDigitalProducts({
      id,
      ...updateData
    })
    
    // Fetch and return updated product
    const [updatedProduct] = await digitalProductService.listDigitalProducts({
      filters: { id }
    })
    
    res.json({ digital_product: updatedProduct })
  } catch (error) {
    console.error("Error updating digital product:", error)
    res.status(500).json({ 
      error: error.message || "Failed to update digital product" 
    })
  }
}

// DELETE /admin/digital-products/:id - Delete a digital product
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const { id } = req.params
    const digitalProductService: DigitalProductModuleService = 
      req.scope.resolve(DIGITAL_PRODUCT_MODULE)
    
    // Use the service method that also deletes the file
    await digitalProductService.deleteDigitalProductWithFile(id)
    
    res.json({ 
      message: "Digital product deleted successfully",
      id 
    })
  } catch (error) {
    console.error("Error deleting digital product:", error)
    res.status(500).json({ 
      error: error.message || "Failed to delete digital product" 
    })
  }
} 