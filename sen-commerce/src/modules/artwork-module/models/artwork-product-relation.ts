import { model } from "@medusajs/framework/utils"

// Junction table for artwork-product many-to-many relationships
export const ArtworkProductRelation = model.define("artwork_product_relation", {
  id: model.id().primaryKey(),
  
  // Foreign keys
  artwork_id: model.text(), // References artwork.id
  product_id: model.text(), // Can reference digital_product.id or printful_product.id
  product_type: model.text(), // "digital" | "printful_pod" | "standard"
  
  // Relationship metadata
  is_primary: model.boolean().default(false), // Is this the primary artwork for the product?
  position: model.number().default(0), // Order of artwork on product
})