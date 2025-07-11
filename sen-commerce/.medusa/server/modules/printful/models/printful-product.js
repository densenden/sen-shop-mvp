"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrintfulWebhookEvent = exports.PrintfulOrderTracking = exports.PrintfulSyncLog = exports.PrintfulProductFile = exports.PrintfulProductVariant = exports.PrintfulProduct = void 0;
const utils_1 = require("@medusajs/framework/utils");
// Enhanced Printful product model with additional fields
exports.PrintfulProduct = utils_1.model.define("printful_product", {
    id: utils_1.model.id().primaryKey(),
    artwork_id: utils_1.model.text().nullable(), // Foreign key to artwork
    printful_product_id: utils_1.model.text(), // ID from Printful
    name: utils_1.model.text(), // Product name
    description: utils_1.model.text().nullable(), // Product description
    thumbnail_url: utils_1.model.text().nullable(), // Primary product image
    video_url: utils_1.model.text().nullable(), // Product video URL
    additional_images: utils_1.model.json().nullable(), // Array of additional image URLs
    metadata: utils_1.model.json().nullable(), // Additional metadata
    status: utils_1.model.text().default("active"), // Product status
    provider_type: utils_1.model.text().default("printful"), // POD provider type
    // SEO and marketing fields
    seo_title: utils_1.model.text().nullable(),
    seo_description: utils_1.model.text().nullable(),
    tags: utils_1.model.json().nullable(), // Array of tags
    category: utils_1.model.text().nullable(),
    // Pricing fields
    base_price: utils_1.model.number().nullable(),
    sale_price: utils_1.model.number().nullable(),
    currency: utils_1.model.text().default("USD"),
    in_stock: utils_1.model.boolean().default(true),
    // Legacy price field for backward compatibility
    price: utils_1.model.number().nullable(),
});
// Product variant model
exports.PrintfulProductVariant = utils_1.model.define("printful_product_variant", {
    id: utils_1.model.id().primaryKey(),
    product_id: utils_1.model.text(), // FK to printful_product
    printful_variant_id: utils_1.model.text(),
    name: utils_1.model.text(),
    size: utils_1.model.text().nullable(),
    color: utils_1.model.text().nullable(),
    price: utils_1.model.number().nullable(),
    currency: utils_1.model.text().default("USD"),
    image_url: utils_1.model.text().nullable(),
    availability: utils_1.model.text().default("available"),
    metadata: utils_1.model.json().nullable(),
});
// Product file model for design files
exports.PrintfulProductFile = utils_1.model.define("printful_product_file", {
    id: utils_1.model.id().primaryKey(),
    product_id: utils_1.model.text(), // FK to printful_product
    file_type: utils_1.model.text(), // 'design', 'mockup', 'template', etc.
    file_url: utils_1.model.text(),
    file_name: utils_1.model.text().nullable(),
    file_size: utils_1.model.number().nullable(),
    mime_type: utils_1.model.text().nullable(),
    printful_file_id: utils_1.model.text().nullable(),
    placement: utils_1.model.text().nullable(), // 'front', 'back', etc.
    is_primary: utils_1.model.boolean().default(false),
    metadata: utils_1.model.json().nullable(),
});
// Sync log model
exports.PrintfulSyncLog = utils_1.model.define("printful_sync_log", {
    id: utils_1.model.id().primaryKey(),
    product_id: utils_1.model.text().nullable(), // FK to printful_product
    sync_type: utils_1.model.text(), // 'import', 'update', 'delete'
    status: utils_1.model.text(), // 'pending', 'success', 'failed'
    provider_type: utils_1.model.text(),
    error_message: utils_1.model.text().nullable(),
    sync_data: utils_1.model.json().nullable(),
    completed_at: utils_1.model.dateTime().nullable(),
});
// Order tracking model
exports.PrintfulOrderTracking = utils_1.model.define("printful_order_tracking", {
    id: utils_1.model.id().primaryKey(),
    medusa_order_id: utils_1.model.text(),
    printful_order_id: utils_1.model.text(),
    provider_type: utils_1.model.text().default("printful"),
    status: utils_1.model.text(),
    tracking_number: utils_1.model.text().nullable(),
    tracking_url: utils_1.model.text().nullable(),
    shipped_at: utils_1.model.dateTime().nullable(),
    delivered_at: utils_1.model.dateTime().nullable(),
    estimated_delivery: utils_1.model.dateTime().nullable(),
    fulfillment_data: utils_1.model.json().nullable(),
});
// Webhook events model
exports.PrintfulWebhookEvent = utils_1.model.define("printful_webhook_events", {
    id: utils_1.model.id().primaryKey(),
    provider_type: utils_1.model.text(),
    event_type: utils_1.model.text(),
    event_data: utils_1.model.json(),
    signature: utils_1.model.text().nullable(),
    processed: utils_1.model.boolean().default(false),
    processed_at: utils_1.model.dateTime().nullable(),
    error_message: utils_1.model.text().nullable(),
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJpbnRmdWwtcHJvZHVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL3ByaW50ZnVsL21vZGVscy9wcmludGZ1bC1wcm9kdWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFEQUFpRDtBQUVqRCx5REFBeUQ7QUFDNUMsUUFBQSxlQUFlLEdBQUcsYUFBSyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRTtJQUM5RCxFQUFFLEVBQUUsYUFBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsRUFBRTtJQUMzQixVQUFVLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLHlCQUF5QjtJQUM5RCxtQkFBbUIsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsbUJBQW1CO0lBQ3RELElBQUksRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLEVBQUUsZUFBZTtJQUNuQyxXQUFXLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLHNCQUFzQjtJQUM1RCxhQUFhLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLHdCQUF3QjtJQUNoRSxTQUFTLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLFFBQVEsRUFBRSxFQUFFLG9CQUFvQjtJQUN4RCxpQkFBaUIsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsaUNBQWlDO0lBQzdFLFFBQVEsRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsc0JBQXNCO0lBQ3pELE1BQU0sRUFBRSxhQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFLGlCQUFpQjtJQUN6RCxhQUFhLEVBQUUsYUFBSyxDQUFDLElBQUksRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMs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