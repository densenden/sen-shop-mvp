import { model } from "@medusajs/framework/utils"

// This model represents a Printful product linked to an artwork
export const PrintfulProduct = model.define("printful_product", {
  id: model.id().primaryKey(),
  artwork_id: model.text(), // Foreign key to artwork
  printful_product_id: model.text(), // ID from Printful
  name: model.text(), // Product name
  thumbnail_url: model.text().nullable(), // Product image
  price: model.number().nullable(), // Price (can be null if not set)
}) 