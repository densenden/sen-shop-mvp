import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  const artworks = await artworkModuleService.listArtworks({
    relations: ["artwork_collection"]
  })
  res.json({ artworks })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  const body = req.body as any
  const artwork = await artworkModuleService.createArtworks(body)
  res.json(artwork)
} 