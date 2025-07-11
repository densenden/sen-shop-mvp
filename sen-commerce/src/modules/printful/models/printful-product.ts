import { model } from "@medusajs/framework/utils"

// Enhanced Printful product model with additional fields
export const PrintfulProduct = model.define("printful_product", {
  id: model.id().primaryKey(),
  artwork_id: model.text().nullable(), // Foreign key to artwork
  printful_product_id: model.text(), // ID from Printful
  name: model.text(), // Product name
  description: model.text().nullable(), // Product description
  thumbnail_url: model.text().nullable(), // Primary product image
  video_url: model.text().nullable(), // Product video URL
  additional_images: model.json().nullable(), // Array of additional image URLs
  metadata: model.json().nullable(), // Additional metadata
  status: model.text().default("active"), // Product status
  provider_type: model.text().default("printful"), // POD provider type
  
  // SEO and marketing fields
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  tags: model.json().nullable(), // Array of tags
  category: model.text().nullable(),
  
  // Pricing fields
  base_price: model.number().nullable(),
  sale_price: model.number().nullable(),
  currency: model.text().default("USD"),
  in_stock: model.boolean().default(true),
  
  // Legacy price field for backward compatibility
  price: model.number().nullable(),
})

// Product variant model
export const PrintfulProductVariant = model.define("printful_product_variant", {
  id: model.id().primaryKey(),
  product_id: model.text(), // FK to printful_product
  printful_variant_id: model.text(),
  name: model.text(),
  size: model.text().nullable(),
  color: model.text().nullable(),
  price: model.number().nullable(),
  currency: model.text().default("USD"),
  image_url: model.text().nullable(),
  availability: model.text().default("available"),
  metadata: model.json().nullable(),
})

// Product file model for design files
export const PrintfulProductFile = model.define("printful_product_file", {
  id: model.id().primaryKey(),
  product_id: model.text(), // FK to printful_product
  file_type: model.text(), // 'design', 'mockup', 'template', etc.
  file_url: model.text(),
  file_name: model.text().nullable(),
  file_size: model.number().nullable(),
  mime_type: model.text().nullable(),
  printful_file_id: model.text().nullable(),
  placement: model.text().nullable(), // 'front', 'back', etc.
  is_primary: model.boolean().default(false),
  metadata: model.json().nullable(),
})

// Sync log model
export const PrintfulSyncLog = model.define("printful_sync_log", {
  id: model.id().primaryKey(),
  product_id: model.text().nullable(), // FK to printful_product
  sync_type: model.text(), // 'import', 'update', 'delete'
  status: model.text(), // 'pending', 'success', 'failed'
  provider_type: model.text(),
  error_message: model.text().nullable(),
  sync_data: model.json().nullable(),
  completed_at: model.dateTime().nullable(),
})

// Order tracking model
export const PrintfulOrderTracking = model.define("printful_order_tracking", {
  id: model.id().primaryKey(),
  medusa_order_id: model.text(),
  printful_order_id: model.text(),
  provider_type: model.text().default("printful"),
  status: model.text(),
  tracking_number: model.text().nullable(),
  tracking_url: model.text().nullable(),
  shipped_at: model.dateTime().nullable(),
  delivered_at: model.dateTime().nullable(),
  estimated_delivery: model.dateTime().nullable(),
  fulfillment_data: model.json().nullable(),
})

// Webhook events model
export const PrintfulWebhookEvent = model.define("printful_webhook_events", {
  id: model.id().primaryKey(),
  provider_type: model.text(),
  event_type: model.text(),
  event_data: model.json(),
  signature: model.text().nullable(),
  processed: model.boolean().default(false),
  processed_at: model.dateTime().nullable(),
  error_message: model.text().nullable(),
}) 