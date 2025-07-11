import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Get query parameters for filtering
    const { 
      limit = 20, 
      offset = 0,
      handle,
      tag,
      collection_id,
      category_id 
    } = req.query

    // Try to get real products from the database
    let products = []
    let count = 0
    
    try {
      const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
      
      // Build filter object
      const filters: any = {}
      if (handle) filters.handle = handle
      if (tag) filters.tags = { name: tag }
      if (collection_id) filters.collection_id = collection_id
      if (category_id) filters.category_id = category_id

      // Try to get real products
      const result = await productService.listProducts(filters, {
        relations: ["variants", "images", "tags", "categories"],
        take: Number(limit),
        skip: Number(offset)
      })
      
      products = result || []
      count = products.length
      
    } catch (productError) {
      console.log("Could not fetch real products, using mock data:", productError.message)
      
      // Fall back to mock data
      const mockProducts = [
        {
          id: "prod_01",
          title: "Sample Digital Art",
          description: "Beautiful digital artwork for your collection",
          status: "published",
          metadata: {
            fulfillment_type: "digital_download",
            file_size: 2048576,
            mime_type: "image/png"
          },
          variants: [{
            id: "var_01",
            title: "Digital Download",
            price: 1999,
            sku: "digital-art-01"
          }],
          tags: ["digital", "art"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "prod_02", 
          title: "Custom T-Shirt",
          description: "Print-on-demand custom t-shirt",
          status: "published",
          metadata: {
            fulfillment_type: "printful_pod",
            printful_product_id: "123",
            source_provider: "printful"
          },
          variants: [{
            id: "var_02",
            title: "Medium",
            price: 2999,
            sku: "tshirt-med-01"
          }],
          tags: ["printful", "clothing"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      
      products = mockProducts
      count = mockProducts.length
    }
    
    res.json({
      products: products || [],
      count: count || 0,
      limit: Number(limit),
      offset: Number(offset)
    })
    
  } catch (error) {
    console.error("[Store Products] Error fetching products:", error)
    res.status(500).json({ 
      error: "Failed to fetch products",
      message: error.message 
    })
  }
}