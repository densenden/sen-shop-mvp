import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("Fetching artwork collections for store...")
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get collections from the artwork module service
    const collections = await artworkModuleService.listArtworkCollections({})
    console.log("Collections found:", collections?.length || 0)
    
    // Get artworks and group them by collection
    let collectionsWithArtworks = collections || []
    if (collections && collections.length > 0) {
      try {
        const artworks = await artworkModuleService.listArtworks({})
        console.log("Artworks found:", artworks?.length || 0)
        
        // Get all products
        const allProducts = await productModuleService.listProducts({}, {
          relations: ["variants"]
        })
        console.log("Products found:", allProducts?.length || 0)
        
        // Create a map of artwork ID to products using artwork.product_ids
        const artworkProductMap = new Map()
        for (const artwork of artworks || []) {
          if (artwork.product_ids && Array.isArray(artwork.product_ids)) {
            const artworkProducts: any[] = []
            for (const productId of artwork.product_ids) {
              const product = allProducts.find(p => p.id === productId)
              if (product) {
                artworkProducts.push({
                  id: product.id,
                  title: product.title,
                  handle: product.handle || product.id,
                  thumbnail: product.thumbnail,
                  // Don't add mock pricing - let the frontend handle pricing display
                })
              }
            }
            artworkProductMap.set(artwork.id, artworkProducts)
          }
        }
        
        // Group artworks by collection and add products
        collectionsWithArtworks = collections.map(collection => ({
          ...collection,
          artwork_count: artworks.filter(artwork => artwork.artwork_collection_id === collection.id).length,
          artworks: artworks.filter(artwork => artwork.artwork_collection_id === collection.id).map(artwork => ({
            ...artwork,
            products: artworkProductMap.get(artwork.id) || []
          })) || []
        }))
      } catch (artworkError) {
        console.log("Could not fetch artworks, returning collections without artworks:", artworkError.message)
        collectionsWithArtworks = collections.map(collection => ({
          ...collection,
          artwork_count: 0,
          artworks: []
        }))
      }
    }
    
    res.json({
      collections: collectionsWithArtworks,
      count: collectionsWithArtworks.length
    })
    
  } catch (error) {
    console.error("Error fetching artwork collections for store:", error)
    
    res.json({
      collections: [],
      count: 0
    })
  }
}
