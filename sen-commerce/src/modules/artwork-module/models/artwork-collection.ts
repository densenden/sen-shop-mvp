import { model } from "@medusajs/framework/utils"

export const ArtworkCollection = model.define("artwork_collection", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  topic: model.text().nullable(),
  month_created: model.text().nullable(),
  midjourney_version: model.text().nullable(),
  purpose: model.text().nullable(),
  thumbnail_url: model.text().nullable(),
}) 