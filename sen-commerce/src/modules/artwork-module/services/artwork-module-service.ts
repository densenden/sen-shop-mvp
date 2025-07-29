import { MedusaService } from "@medusajs/framework/utils"
import { Artwork, ArtworkCollection, ArtworkProductRelation } from "../models"

class ArtworkModuleService extends MedusaService({
  Artwork,
  ArtworkCollection,
  ArtworkProductRelation, // Add ArtworkProductRelation to the service
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
  // - listArtworkProductRelations(filters, config)
  // - createArtworkProductRelations(data)
  // - updateArtworkProductRelations(id, data)
  // - deleteArtworkProductRelations(id)

  async createArtworkProductRelation(data: {
    artwork_id: string
    product_id: string
    product_type: "digital" | "printful_pod" | "standard"
    is_primary?: boolean
    position?: number
  }) {
    const [relation] = await this.createArtworkProductRelations([data])
    return relation
  }
}

export { ArtworkModuleService }
