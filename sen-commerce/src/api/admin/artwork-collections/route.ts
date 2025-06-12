import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ARTWORK_MODULE } from "../../../modules/artwork-module"
import { ArtworkModuleService } from "../../../modules/artwork-module/services/artwork-module-service"
import { CreateArtworkCollectionDTO } from "../../../modules/artwork-module/types"

// GET /admin/artwork-collections
export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const artworkModuleService: ArtworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  
  const [collections, count] = await artworkModuleService.listAndCountArtworkCollections()

  res.json({
    collections,
    count,
  })
}

// POST /admin/artwork-collections
export const POST = async (
  req: MedusaRequest<CreateArtworkCollectionDTO>,
  res: MedusaResponse
) => {
  const artworkModuleService: ArtworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  
  const collection = await artworkModuleService.createArtworkCollections(req.body)

  res.json({
    collection,
  })
} 