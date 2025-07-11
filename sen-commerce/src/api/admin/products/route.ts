import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Get Medusa v2 product service
    const productService = req.scope.resolve(Modules.PRODUCT)
    
    // List all products with variants
    const products = await productService.list({}, {
      relations: ["variants", "variants.prices", "tags", "metadata"]
    })
    
    // Format response to match expected structure
    const formattedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description,
      status: product.status,
      metadata: product.metadata || {},
      variants: product.variants || [],
      tags: product.tags || [],
      created_at: product.created_at,
      updated_at: product.updated_at
    }))
    
    res.json({
      products: formattedProducts,
      count: formattedProducts.length
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    res.status(500).json({ 
      error: "Failed to fetch products",
      message: error.message 
    })
  }
}