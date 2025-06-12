import { model } from "@medusajs/framework/utils"
import { ArtworkCollection } from "./artwork-collection"

export const Artwork = model.define("artwork", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  image_url: model.text(),
  artwork_collection_id: model.text(),
  artwork_collection: model.belongsTo(() => ArtworkCollection, {
    mappedBy: "artworks"
  }),
  product_ids: model.array(),
}) 