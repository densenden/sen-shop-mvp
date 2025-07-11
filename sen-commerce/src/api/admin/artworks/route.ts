import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    console.log("Fetching artworks...")
    const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
    console.log("Service resolved:", !!artworkModuleService)
    
    // Try to get artworks first
    const artworks = await artworkModuleService.listArtworks({})
    console.log("Artworks found:", artworks?.length || 0)
    
    // Return simple response without collections for now
    res.json({ 
      artworks: artworks || [],
      count: artworks?.length || 0
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