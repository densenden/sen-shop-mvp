import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  const artworkCollections = await artworkModuleService.listArtworkCollections()
  res.json(artworkCollections)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  const body = req.body
  console.log('[artwork-collections] POST body:', body)
  try {
    const artworkCollection = await artworkModuleService.createArtworkCollections(body)
    console.log('[artwork-collections] Created:', artworkCollection)
    res.json(artworkCollection)
  } catch (error) {
    console.error('[artwork-collections] Error:', error)
    res.status(500).json({ code: 'unknown_error', type: 'unknown_error', message: error.message || 'An unknown error occurred.' })
  }
} 