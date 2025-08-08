import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../../modules/artwork-module"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
  const { id } = req.params
  
  try {
    const collection = await artworkModuleService.retrieveArtworkCollection(id)
    
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" })
    }
    
    res.json({ collection })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
  const { id } = req.params
  const body = req.body as any
  
  try {
    const updated = await artworkModuleService.updateArtworkCollections({ id, ...body })
    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE) as any
  const { id } = req.params
  
  try {
    await artworkModuleService.deleteArtworkCollections(id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
} 