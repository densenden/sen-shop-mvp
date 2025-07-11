import { MedusaService } from "@medusajs/framework/utils"
import { Artwork, ArtworkCollection } from "../models"

class ArtworkModuleService extends MedusaService({
  Artwork,
  ArtworkCollection,
}) {
  async listArtworkCollections(filters: any = {}, config: any = {}) {
    // Get collections
    const collections = await this.list(ArtworkCollection, filters, config)
    
    // If relations include artworks, load them separately
    if (config.relations?.includes("artworks")) {
      for (const collection of collections) {
        const artworks = await this.list(Artwork, { 
          artwork_collection_id: collection.id 
        }, {})
        collection.artworks = artworks
      }
    }
    
    return collections
  }
  
  async listArtworks(filters: any = {}, config: any = {}) {
    return await this.list(Artwork, filters, config)
  }
}

export { ArtworkModuleService } 