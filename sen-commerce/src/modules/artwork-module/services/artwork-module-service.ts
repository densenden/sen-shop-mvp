import { MedusaService } from "@medusajs/framework/utils"
import { Artwork, ArtworkCollection } from "../models"

class ArtworkModuleService extends MedusaService({
  Artwork,
  ArtworkCollection,
}) {
  // MedusaService automatically generates:
  // - listArtworks(filters, config)
  // - listArtworkCollections(filters, config)
  // - createArtworks(data)
  // - createArtworkCollections(data)
  // - updateArtworks(id, data)
  // - updateArtworkCollections(id, data)
  // - deleteArtworks(id)
  // - deleteArtworkCollections(id)
}

export { ArtworkModuleService } 