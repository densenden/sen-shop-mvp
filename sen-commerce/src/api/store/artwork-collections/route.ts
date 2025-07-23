import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    console.log("Fetching artwork collections for store...")
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
    
    // Get collections from the artwork module service
    const collections = await artworkModuleService.listArtworkCollections({})
    console.log("Collections found:", collections?.length || 0)
    
    // Get artworks and group them by collection
    let collectionsWithArtworks = collections || []
    if (collections && collections.length > 0) {
      try {
        const artworks = await artworkModuleService.listArtworks({})
        console.log("Artworks found:", artworks?.length || 0)
        
        // Group artworks by collection
        collectionsWithArtworks = collections.map(collection => ({
          ...collection,
          artworks: artworks.filter(artwork => artwork.artwork_collection_id === collection.id) || []
        }))
      } catch (artworkError) {
        console.log("Could not fetch artworks, returning collections without artworks:", artworkError.message)
        collectionsWithArtworks = collections.map(collection => ({
          ...collection,
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