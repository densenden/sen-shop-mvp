import { EntityRepository } from "@mikro-orm/core"
import { ArtworkCollection } from "../models"

export class ArtworkCollectionRepository extends EntityRepository<typeof ArtworkCollection> {
  // The base repository methods are automatically provided by EntityRepository
}

export default ArtworkCollectionRepository 