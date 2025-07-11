import { model } from "@medusajs/framework/utils"

// This model represents a digital product (file that can be downloaded)
// It will be linked to regular products
export const DigitalProduct = model.define("digital_product", {
  id: model.id().primaryKey(),
  
  // File information
  name: model.text(), // Display name for the file
  file_url: model.text(), // URL in Supabase bucket
  file_key: model.text(), // Key/path in the bucket
  file_size: model.number(), // Size in bytes
  mime_type: model.text(), // File type (pdf, jpg, etc)
  
  // Metadata
  description: model.text().nullable(), // Optional description
  preview_url: model.text().nullable(), // Optional preview image
  
  // Access control
  max_downloads: model.number().default(-1), // -1 = unlimited
  expires_at: model.dateTime().nullable(), // Optional expiry date
  
}) 