import { MedusaService } from "@medusajs/framework/utils"
import { Artwork, ArtworkCollection } from "../models"

class ArtworkModuleService extends MedusaService({
  Artwork,
  ArtworkCollection,
}) {}

export { ArtworkModuleService } 