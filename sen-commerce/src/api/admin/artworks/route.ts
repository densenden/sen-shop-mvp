import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
    
    const artworks = await artworkModuleService.listArtworks({})
    const collections = await artworkModuleService.listArtworkCollections({})
    
    const collectionsMap = new Map(collections.map(c => [c.id, c]))
    
    const artworksWithCollections = artworks.map(artwork => ({
      ...artwork,
      artwork_collection: collectionsMap.get(artwork.artwork_collection_id)
    }))
    
    res.json({ 
      artworks: artworksWithCollections || [],
      count: artworksWithCollections?.length || 0
    })
  } catch (error) {
    console.error("Error fetching artworks:", error)
    res.status(500).json({
      error: "Failed to fetch artworks",
      message: error.message
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
    const body = req.body as any
    const artwork = await artworkModuleService.createArtworks(body)
    res.json(artwork)
  } catch (error) {
    console.error("Error creating artwork:", error)
    res.status(500).json({
      error: "Failed to create artwork",
      message: error.message
    })
  }
} 