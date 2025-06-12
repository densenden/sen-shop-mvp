import { Module } from "@medusajs/framework/utils"
import { ArtworkModuleService } from "./services/artwork-module-service"
import ArtworkRepository from "./repositories/artwork-repository"
import ArtworkCollectionRepository from "./repositories/artwork-collection-repository"

export const ARTWORK_MODULE = "artworkModuleService"

export default Module(ARTWORK_MODULE, {
  service: ArtworkModuleService,
  repositories: {
    artworkRepository: ArtworkRepository,
    artworkCollectionRepository: ArtworkCollectionRepository,
  },
}) 