import { model } from "@medusajs/framework/utils"

// This model tracks each download of a digital product
// Used for access control and analytics
export const DigitalProductDownload = model.define("digital_product_download", {
  id: model.id().primaryKey(),
  
  // Relations
  digital_product_id: model.text(), // Link to digital product
  order_id: model.text(), // Link to order
  customer_id: model.text(), // Who downloaded
  
  // Access token for secure downloads
  token: model.text().unique(), // Unique download token
  
  // Download tracking
  download_count: model.number().default(0),
  last_downloaded_at: model.dateTime().nullable(),
  expires_at: model.dateTime().nullable(),
  
  // Status
  is_active: model.boolean().default(true),
}) 