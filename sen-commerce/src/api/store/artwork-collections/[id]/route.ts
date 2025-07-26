import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../../modules/artwork-module"
import { ArtworkModuleService } from "../../../../modules/artwork-module/services/artwork-module-service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    console.log(`Fetching artwork collection with ID: ${id}`)
    
    const artworkModuleService: ArtworkModuleService = req.scope.resolve(ARTWORK_MODULE)
    
    // Get the specific collection
    const collection = await artworkModuleService.retrieveArtworkCollection(id)
    
    if (!collection) {
      return res.status(404).json({
        error: "Collection not found"
      })
    }
    
    // Get artworks for this collection
    let artworks = []
    try {
      const collectionArtworks = await artworkModuleService.listArtworks({
        artwork_collection_id: id
      })
      artworks = collectionArtworks || []
    } catch (error) {
      console.log("Could not fetch artworks for collection:", error.message)
    }
    
    const collectionWithArtworks = {
      ...collection,
      artworks
    }
    
    res.json({
      collection: collectionWithArtworks
    })
    
  } catch (error) {
    console.error("Error fetching artwork collection:", error)
    res.status(500).json({
      error: "Failed to fetch collection",
      message: error.message
    })
  }
}