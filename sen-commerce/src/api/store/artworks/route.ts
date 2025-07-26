import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"
import { ArtworkModuleService } from "../../../modules/artwork-module/services/artwork-module-service"
import { IProductModuleService, ProductDTO } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// GET /store/artworks
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const artworkModuleService: ArtworkModuleService = req.scope.resolve(ARTWORK_MODULE)
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    let artworks: any[] = []
    let count = 0

    try {
      const [dbArtworks, dbCount] = await artworkModuleService.listAndCountArtworks(
        {},
        {}
      )

      // Enrich artworks with product data
      const enrichedArtworks = await Promise.all(
        dbArtworks.map(async (artwork) => {
          let products: ProductDTO[] = []
          
          console.log(`Processing artwork ${artwork.id}, product_ids:`, artwork.product_ids, 'type:', typeof artwork.product_ids)
          
          // Handle different formats of product_ids
          let productIds: string[] = []
          if (artwork.product_ids) {
            if (Array.isArray(artwork.product_ids)) {
              productIds = artwork.product_ids.filter(id => typeof id === 'string')
            } else if (typeof artwork.product_ids === 'string') {
              try {
                const parsed = JSON.parse(artwork.product_ids)
                productIds = Array.isArray(parsed) ? parsed : []
              } catch {
                productIds = [artwork.product_ids]
              }
            }
          }
          
          console.log(`Resolved product IDs for artwork ${artwork.id}:`, productIds)
          
          if (productIds.length > 0) {
            try {
              const productResult: ProductDTO[] = await productService.listProducts({
                id: productIds,
              })
              products = productResult
              console.log(`Found ${products.length} products for artwork ${artwork.id}`)
            } catch (productError) {
              console.error(`Error fetching products for artwork ${artwork.id}:`, productError.message)
            }
          }

          return {
            ...artwork,
            products,
          }
        })
      )

      artworks = enrichedArtworks
      count = dbCount
    } catch (error) {
      console.error("Could not fetch artworks:", error.message)
      
      artworks = []
      count = 0
    }

    res.json({
      artworks,
      count,
    })
  } catch (error) {
    console.error("[Store Artworks] Error fetching artworks:", error)
    res.status(500).json({ 
      error: "Failed to fetch artworks",
      message: error.message 
    })
  }
} 