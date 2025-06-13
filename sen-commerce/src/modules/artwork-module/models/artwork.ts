import { model } from "@medusajs/framework/utils"

export const Artwork = model.define("artwork", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  image_url: model.text(),
  artwork_collection_id: model.text(),
  product_ids: model.array(),
}) 