import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../../modules/artwork-module"
import { ArtworkModuleService } from "../../../../modules/artwork-module/services/artwork-module-service"
import { UpdateArtworkDTO } from "../../../../modules/artwork-module/types"

// GET /admin/artworks/:id
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  const { id } = req.params
  
  try {
    // Use retrieveArtwork instead of listArtworks with filters
    const artwork = await artworkModuleService.retrieveArtwork(id)
    
    if (!artwork) {
      return res.status(404).json({ error: "Artwork not found" })
    }
    
    // Ensure product_ids is always an array
    const artworkData = {
      ...artwork,
      product_ids: artwork.product_ids || []
    }
    
    res.json({ artwork: artworkData })
  } catch (error) {
    console.error("Error fetching artwork:", error)
    res.status(500).json({ error: error.message })
  }
}

// PUT /admin/artworks/:id
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  const { id } = req.params
  const body = req.body as any
  
  try {
    // Ensure product_ids is properly formatted for storage
    const updateData = {
      ...body,
      product_ids: body.product_ids || []
    }
    
    const updated = await artworkModuleService.updateArtworks({ id, ...updateData })
    res.json(updated)
  } catch (error) {
    console.error("Error updating artwork:", error)
    res.status(500).json({ error: error.message })
  }
}

// DELETE /admin/artworks/:id
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  const { id } = req.params
  
  try {
    await artworkModuleService.deleteArtworks(id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
} 