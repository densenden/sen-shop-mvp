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
        {
          relations: ["artwork_collection"],
        }
      )

      // Enrich artworks with product data
      const enrichedArtworks = await Promise.all(
        dbArtworks.map(async (artwork) => {
          let products: ProductDTO[] = []
          
          if (Array.isArray(artwork.product_ids) && artwork.product_ids.length > 0) {
            const productResult: ProductDTO[] = await productService.listProducts({
              id: artwork.product_ids as string[],
            })
            products = productResult
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