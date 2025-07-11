import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

console.log("[Medusa] Loaded /admin/artwork-collections route.ts");

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log("Fetching artwork collections...")
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
    console.log("Service resolved:", !!artworkModuleService)
    
    // Try to list collections without relations first
    const collections = await artworkModuleService.listArtworkCollections({})
    console.log("Collections found:", collections?.length || 0)
    
    // If successful, try to get artworks for each collection
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
      }
    }
    
    res.json(collectionsWithArtworks)
  } catch (error) {
    console.error("Error fetching artwork collections:", error)
    res.status(500).json({
      error: "Failed to fetch artwork collections",
      message: error.message
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
    const body = req.body as any
    console.log('[artwork-collections] POST body:', body)
    
    const artworkCollection = await artworkModuleService.createArtworkCollections(body)
    console.log('[artwork-collections] Created:', artworkCollection)
    res.json(artworkCollection)
  } catch (error) {
    console.error('[artwork-collections] Error:', error)
    res.status(500).json({ 
      error: 'Failed to create artwork collection',
      message: error.message || 'An unknown error occurred.' 
    })
  }
} 