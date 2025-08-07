import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Remove Artwork Metadata] Cleaning up artwork_id from product metadata")
  
  try {
    const productService = req.scope.resolve(Modules.PRODUCT)
    
    // Get all products
    const products = await productService.listProducts({}, { 
      select: ["id", "metadata"],
      take: 1000 
    })
    
    console.log(`[Remove Artwork Metadata] Found ${products.length} products to check`)
    
    let updatedCount = 0
    
    for (const product of products) {
      if (product.metadata && product.metadata.artwork_id) {
        console.log(`[Remove Artwork Metadata] Removing artwork_id from product ${product.id}`)
        
        // Create new metadata without artwork_id
        const { artwork_id, ...cleanMetadata } = product.metadata
        
        // Update the product with cleaned metadata
        await productService.updateProducts({
          id: product.id,
          metadata: cleanMetadata
        })
        
        updatedCount++
      }
    }
    
    console.log(`[Remove Artwork Metadata] Cleanup completed - updated ${updatedCount} products`)
    
    res.json({
      success: true,
      message: `Removed artwork_id metadata from ${updatedCount} products`,
      stats: {
        products_checked: products.length,
        products_updated: updatedCount
      }
    })
    
  } catch (error) {
    console.error("[Remove Artwork Metadata] Error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to remove artwork metadata",
      details: error.message
    })
  }
}