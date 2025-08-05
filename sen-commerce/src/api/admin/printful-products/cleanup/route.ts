import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { IProductModuleService } from "@medusajs/framework/types"

// DELETE /admin/printful-products/cleanup - Delete all Printful POD products
export const DELETE = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const productService: IProductModuleService = 
      req.scope.resolve(Modules.PRODUCT)
    
    // Find all Printful POD products
    const printfulProducts = await productService.listProducts({
      filters: {
        metadata: {
          fulfillment_type: "printful_pod"
        }
      }
    })
    
    if (printfulProducts.length === 0) {
      return res.json({ 
        message: "No Printful products found to delete",
        deleted_count: 0 
      })
    }
    
    console.log(`Found ${printfulProducts.length} Printful products to delete`)
    
    // Delete all Printful products
    const productIds = printfulProducts.map(product => product.id)
    
    for (const productId of productIds) {
      try {
        await productService.deleteProducts(productId)
        console.log(`Deleted Printful product: ${productId}`)
      } catch (error) {
        console.error(`Failed to delete product ${productId}:`, error)
      }
    }
    
    res.json({ 
      message: `Successfully deleted ${printfulProducts.length} Printful products`,
      deleted_count: printfulProducts.length,
      deleted_product_ids: productIds
    })
    
  } catch (error) {
    console.error("Error cleaning up Printful products:", error)
    res.status(500).json({ 
      error: error.message || "Failed to cleanup Printful products" 
    })
  }
}