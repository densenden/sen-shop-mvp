import { model } from "@medusajs/framework/utils"

// This model represents a Printful POD product linked to an artwork
export const PodProduct = model.define("pod_product", {
  id: model.id().primaryKey(),
  artwork_id: model.text(), // Foreign key to artwork
  printful_product_id: model.text(), // ID from Printful
  name: model.text(), // Product name
  thumbnail_url: model.text().nullable(), // Product image
  price: model.number().nullable(), // Price (can be null if not set)
  created_at: model.dateTime().default(new Date()),
  updated_at: model.dateTime().default(new Date()),
  deleted_at: model.dateTime().nullable(),
}) 