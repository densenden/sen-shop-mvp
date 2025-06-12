import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"
import { ArtworkModuleService } from "../../../modules/artwork-module/services/artwork-module-service"
import { CreateArtworkDTO } from "../../../modules/artwork-module/types"

// GET /admin/artworks
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const artworkModuleService: ArtworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  
  const [artworks, count] = await artworkModuleService.listAndCountArtworks(
    {},
    {
      relations: ["artwork_collection"],
    }
  )

  res.json({
    artworks,
    count,
  })
}

// POST /admin/artworks
export const POST = async (
  req: MedusaRequest<CreateArtworkDTO>,
  res: MedusaResponse
) => {
  const artworkModuleService: ArtworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  
  const artwork = await artworkModuleService.createArtworks(req.body)

  res.json({
    artwork,
  })
} 