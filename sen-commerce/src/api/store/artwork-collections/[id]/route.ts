import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService } from "@medusajs/types"
import { ARTWORK_MODULE } from "../../../../modules/artwork-module"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    console.log("Fetching artwork collection for store:", id)
    
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get the specific collection
    const collection = await artworkModuleService.retrieveArtworkCollection(id)
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" })
    }
    
    console.log("Collection found:", collection.name)
    
    try {
      // Get artworks for this collection
      const artworks = await artworkModuleService.listArtworks({
        artwork_collection_id: id
      })
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
      
      // Add products to artworks
      const artworksWithProducts = artworks.map(artwork => ({
        ...artwork,
        products: artworkProductMap.get(artwork.id) || []
      }))
      
      const collectionWithArtworks = {
        ...collection,
        artwork_count: artworks.length,
        artworks: artworksWithProducts
      }
      
      res.json({
        collection: collectionWithArtworks
      })
      
    } catch (artworkError) {
      console.log("Could not fetch artworks, returning collection without artworks:", artworkError.message)
      res.json({
        collection: {
          ...collection,
          artwork_count: 0,
          artworks: []
        }
      })
    }
    
  } catch (error) {
    console.error("Error fetching artwork collection for store:", error)
    res.status(500).json({ 
      error: "Failed to fetch collection",
      message: error.message 
    })
  }
}
