import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../../modules/artwork-module"
import { ArtworkModuleService } from "../../../../modules/artwork-module/services/artwork-module-service"
import { UpdateArtworkDTO } from "../../../../modules/artwork-module/types"

// GET /admin/artworks/:id
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse,
  { params }: { params: { id: string } }
) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  const artwork = await artworkModuleService.retrieveArtwork(params.id)
  res.json(artwork)
}

// PUT /admin/artworks/:id
export const PUT = async (
  req: MedusaRequest<UpdateArtworkDTO>,
  res: MedusaResponse
) => {
  const artworkModuleService: ArtworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  
  const artwork = await artworkModuleService.updateArtworks({ id: req.params.id }, req.body)

  res.json({
    artwork,
  })
}

// DELETE /admin/artworks/:id
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse,
  { params }: { params: { id: string } }
) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  await artworkModuleService.deleteArtworks(params.id)
  res.status(204).end()
} 