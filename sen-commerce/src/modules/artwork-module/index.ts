import { Module } from "@medusajs/framework/utils"
import { ArtworkModuleService } from "./services/artwork-module-service"
export { ImageUploadService } from "./services/image-upload-service"

export const ARTWORK_MODULE = "artworkModuleService"

export default Module(ARTWORK_MODULE, {
  service: ArtworkModuleService,
}) 