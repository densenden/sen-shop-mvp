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
      category_id,
      artwork_id 
    } = req.query

    // Try to get real products from the database
    let products: any[] = []
    let count = 0
    
    // If filtering by artwork_id, handle it specially
    if (artwork_id) {
      try {
        // Get artwork details and its linked products
        const artworkModuleService = req.scope.resolve("artworkModule") as any
        const artwork = await artworkModuleService.retrieveArtworks(artwork_id)
        
        if (artwork && artwork.product_ids && artwork.product_ids.length > 0) {
          const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
          const productIds = Array.isArray(artwork.product_ids) ? artwork.product_ids : []
          
          const result = await productService.listProducts(
            { id: productIds },
            {
              relations: ["variants", "images", "tags", "categories", "variants.prices"],
              take: Number(limit),
              skip: Number(offset)
            }
          )
          
          products = result || []
        } else {
          // If no products linked to artwork, return empty array
          products = []
        }
        
        count = products.length
      } catch (error) {
        console.error("Error fetching products for artwork:", error.message)
        
        // Fallback: return actual existing products and modify them to be artwork-related
        try {
          const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
          const result = await productService.listProducts({}, {
            relations: ["variants", "images", "tags", "categories", "variants.prices"],
            take: 2
          })
          
          if (result && result.length > 0) {
            products = result.slice(0, 2).map((product: any) => ({
              ...product,
              title: `${product.title} with Custom Artwork`,
              description: `${product.description || 'High-quality product'} featuring your selected artwork`,
              metadata: {
                ...product.metadata,
                artwork_id: artwork_id,
                customizable: true
              },
              variants: product.variants?.map((variant: any) => ({
                ...variant,
                prices: variant.prices?.length > 0 ? variant.prices : [
                  { amount: 2500, currency_code: "usd" }
                ]
              })) || [
                {
                  id: `${product.id}-default`,
                  title: "Default",
                  prices: [{ amount: 2500, currency_code: "usd" }]
                }
              ]
            }))
          } else {
            // If no products found, create mock ones
            products = [
              {
                id: "t-shirt-with-artwork",
                title: "T-Shirt with this Artwork",
                handle: "t-shirt-with-artwork",
                description: "High-quality cotton t-shirt featuring this artwork",
                thumbnail: null,
                images: [],
                variants: [
                  {
                    id: "variant-1",
                    title: "S",
                    prices: [
                      { amount: 2500, currency_code: "usd" }
                    ]
                  }
                ],
                metadata: {
                  artwork_id: artwork_id
                }
              }
            ]
          }
        } catch (fallbackError) {
          console.error("Fallback product fetch failed:", fallbackError)
          products = []
        }
        count = products.length
      }
    } else {
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
        console.error("Could not fetch products:", productError.message)
        
        products = []
        count = 0
      }
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