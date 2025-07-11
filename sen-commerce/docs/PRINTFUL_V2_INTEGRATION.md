# Printful V2 Integration Documentation

## Overview

Complete Printful API V2 integration with enhanced product management, order fulfillment, and multi-POD provider support.

## Features

### ✅ Completed Features

1. **Printful V2 API Integration**
   - Catalog product browsing
   - Store product management
   - Enhanced product data model
   - Multi-provider facade pattern

2. **Order Management**
   - Order creation in Printful
   - Order status tracking
   - Fulfillment workflow automation
   - Shipping cost estimation

3. **Webhook Integration**
   - Real-time order status updates
   - Product update notifications
   - Automatic fulfillment tracking
   - Event logging and debugging

4. **Enhanced Product Management**
   - Video upload support
   - Multiple product photos
   - SEO optimization fields
   - Category and tag management
   - Design file management

5. **Database Schema**
   - Enhanced product tables
   - Variant management
   - File management system
   - Order tracking
   - Sync logging

## Architecture

### Service Layer

```
PODProviderManager
├── PrintfulProvider
│   ├── PrintfulPodProductService (V2 API)
│   ├── PrintfulOrderService
│   ├── PrintfulFulfillmentService
│   └── PrintfulWebhookService
└── GootenProvider (extensible)
```

### Database Schema

#### Core Tables
- `printful_product` - Enhanced product data
- `printful_product_variant` - Product variants
- `printful_product_file` - Design files and media
- `printful_order_tracking` - Order fulfillment tracking
- `printful_sync_log` - Sync operation logs
- `printful_webhook_events` - Webhook event history

### API Endpoints

#### Product Management
```
GET    /admin/printful-products/enhanced
POST   /admin/printful-products/enhanced
GET    /admin/printful-products/enhanced/:id
PUT    /admin/printful-products/enhanced/:id
DELETE /admin/printful-products/enhanced/:id
```

#### File Management
```
GET    /admin/printful-products/enhanced/:id/files
POST   /admin/printful-products/enhanced/:id/files
GET    /admin/printful-products/enhanced/:id/files/:file_id
PUT    /admin/printful-products/enhanced/:id/files/:file_id
DELETE /admin/printful-products/enhanced/:id/files/:file_id
```

#### Webhooks
```
POST   /webhooks/printful
POST   /webhooks/printful/order-updated
POST   /webhooks/printful/product-updated
```

#### Legacy Endpoints (still supported)
```
GET    /admin/printful-catalog-products
POST   /admin/printful-products/:id/link-artwork
```

## Configuration

### Environment Variables

```bash
# Printful API
PRINTFUL_API_TOKEN=your_printful_api_token
PRINTFUL_WEBHOOK_SECRET=your_webhook_secret
DEFAULT_POD_PROVIDER=printful

# Database
DATABASE_URL=postgresql://postgres:password@host:5432/database

# Supabase (for file storage)
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
S3_BUCKET=artworks
S3_ENDPOINT=https://project.supabase.co/storage/v1/s3
```

## Usage Examples

### Creating an Enhanced Product

```typescript
// API Call
POST /admin/printful-products/enhanced
{
  "name": "Custom T-Shirt",
  "description": "High-quality cotton t-shirt with custom design",
  "image_url": "https://example.com/tshirt.jpg",
  "video_url": "https://example.com/tshirt-video.mp4",
  "additional_images": [
    "https://example.com/tshirt-back.jpg",
    "https://example.com/tshirt-detail.jpg"
  ],
  "artwork_id": "artwork_123",
  "seo_title": "Custom Art T-Shirt - Premium Quality",
  "seo_description": "Beautiful custom artwork printed on premium cotton t-shirt",
  "tags": ["art", "fashion", "custom"],
  "category": "apparel",
  "base_price": 25.00,
  "sale_price": 20.00
}
```

### Adding Design Files

```typescript
// Add design file
POST /admin/printful-products/enhanced/prod_123/files
{
  "file_type": "design",
  "file_url": "https://example.com/design.png",
  "file_name": "artwork-design.png",
  "placement": "front",
  "is_primary": true
}

// Add mockup image
POST /admin/printful-products/enhanced/prod_123/files
{
  "file_type": "mockup",
  "file_url": "https://example.com/mockup.jpg",
  "file_name": "product-mockup.jpg",
  "placement": "front",
  "is_primary": false
}
```

### Order Fulfillment Workflow

```typescript
// Using the POD Provider Manager
const podManager = new PODProviderManager(container)

// Process fulfillment
const result = await podManager.processFulfillment(medusaOrder)

// Check status
const status = await podManager.checkFulfillmentStatus(printfulOrderId)
```

## Fulfillment Workflow

### Order Processing Steps

1. **Validation** - Check order has POD products
2. **Conversion** - Convert Medusa order to Printful format
3. **Creation** - Create order in Printful
4. **Confirmation** - Confirm order for production
5. **Tracking** - Monitor fulfillment status
6. **Updates** - Sync status back to Medusa

### Webhook Events

- `order_updated` - Order status changed
- `order_shipped` - Order shipped with tracking
- `order_delivered` - Order delivered
- `order_cancelled` - Order cancelled
- `product_updated` - Product information changed

## Multi-Provider Support

### Adding New Providers

```typescript
class CustomProvider implements PODProvider {
  name = 'Custom POD'
  type = 'custom'
  isEnabled = true

  async fetchProducts(): Promise<PODProduct[]> {
    // Implementation
  }

  async createOrder(orderData: PODOrderData): Promise<PODOrder> {
    // Implementation
  }
  
  // ... other methods
}

// Register provider
const podManager = new PODProviderManager(container)
podManager.registerProvider('custom', new CustomProvider())
```

## File Management

### Supported File Types

- `design` - Artwork design files (PNG, SVG, PDF)
- `mockup` - Product mockup images (JPG, PNG)
- `template` - Design templates
- `photo` - Additional product photos
- `video` - Product videos (MP4, WebM)

### File Placement Options

- `front` - Front of product
- `back` - Back of product  
- `left` - Left side
- `right` - Right side
- `sleeve` - Sleeve area
- `full` - Full product coverage

## Database Migrations

Run migrations to update schema:

```bash
# Apply enhanced schema
psql $DATABASE_URL -f ./src/modules/printful/migrations/002_enhance_product_schema.sql
```

## Monitoring and Debugging

### Sync Logs

Monitor product sync operations:

```sql
SELECT * FROM printful_sync_log 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### Webhook Events

Debug webhook processing:

```sql
SELECT * FROM printful_webhook_events 
WHERE processed = false 
ORDER BY created_at DESC;
```

### Order Tracking

Monitor fulfillment status:

```sql
SELECT 
  pot.medusa_order_id,
  pot.printful_order_id,
  pot.status,
  pot.tracking_number,
  pot.shipped_at
FROM printful_order_tracking pot
WHERE pot.status IN ('pending', 'in_progress');
```

## Testing

### Webhook Testing

```typescript
// Test webhook processing
const webhookService = new PrintfulWebhookService(container)
const result = await webhookService.testWebhook('order_updated', {
  order: {
    id: 'test_order_123',
    status: 'shipped',
    tracking_number: 'TRACK123'
  }
})
```

## Security

### Webhook Verification

All webhooks are verified using HMAC signatures:

```typescript
// Automatic verification in webhook service
const isValid = verifyWebhookSignature(payload, signature)
```

### API Authentication

All admin endpoints require Medusa authentication:

```typescript
// Automatic via Medusa framework
const user = req.auth.actor // Authenticated admin user
```

## Performance Considerations

### Caching

- Product data cached in local database
- Webhook events logged for replay
- Sync operations batched for efficiency

### Rate Limiting

- Printful API has rate limits
- Service implements retry logic
- Background sync for large operations

## Troubleshooting

### Common Issues

1. **Webhook not receiving events**
   - Check PRINTFUL_WEBHOOK_SECRET is set
   - Verify webhook URLs are accessible
   - Check firewall settings

2. **Order fulfillment failing**
   - Verify PRINTFUL_API_TOKEN permissions
   - Check product has valid design files
   - Ensure shipping address is complete

3. **Product sync errors**
   - Check Printful product exists
   - Verify artwork is linked correctly
   - Review sync logs for details

### Debug Mode

Enable debug logging:

```bash
DEBUG=printful:* npm run dev
```

## Future Enhancements

### Planned Features

- [ ] Inventory synchronization
- [ ] Bulk product operations
- [ ] Advanced pricing rules
- [ ] Multi-currency support
- [ ] Custom packaging options
- [ ] Returns management
- [ ] Analytics dashboard

### Provider Roadmap

- [ ] Gooten integration
- [ ] Printify support
- [ ] Custom POD providers
- [ ] Drop-shipping integration

---

**Last Updated:** January 2025  
**Version:** 2.0.0  
**Compatibility:** Medusa v2.8.4+, Printful API v2