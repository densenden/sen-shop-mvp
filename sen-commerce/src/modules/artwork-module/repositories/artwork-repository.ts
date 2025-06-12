import { EntityRepository } from "@mikro-orm/core"
import { Artwork } from "../models"

export class ArtworkRepository extends EntityRepository<typeof Artwork> {
  // The base repository methods are automatically provided by EntityRepository
}

export default ArtworkRepository 