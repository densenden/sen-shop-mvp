import { MedusaService } from "@medusajs/framework/utils"
import { Artwork, ArtworkCollection } from "../models"

export class ArtworkModuleService extends MedusaService({
  Artwork,
  ArtworkCollection,
}) {
  // The parent class automatically provides these methods:
  // - createArtworks
  // - updateArtworks
  // - deleteArtworks
  // - listAndCountArtworks
  // - retrieveArtwork
  // - createArtworkCollections
  // - updateArtworkCollections
  // - deleteArtworkCollections
  // - listAndCountArtworkCollections
  // - retrieveArtworkCollection
} 