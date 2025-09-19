# Printful Studio Integration Plan

## Overview
Integrate Printful Studio workflow into the SenShop MVP platform to enable artists to design and sell custom print-on-demand products directly through the platform.

## Architecture Overview

### 1. Core Components
- **Studio Embed Integration**: Iframe-based Printful Studio integration
- **Product Creation Workflow**: From design to product listing
- **Order Fulfillment**: Automated POD order processing
- **Sync Management**: Product and inventory synchronization

### 2. Key Features
- Seamless design tool integration
- Product template management
- Automated product creation
- Real-time pricing updates
- Order tracking and fulfillment

## Technical Implementation

### Phase 1: Studio Integration Foundation

#### 1.1 Studio Embed Setup
- Implement Printful Studio iframe component
- Handle authentication and session management
- Configure product templates and mockup generators

#### 1.2 API Integration
- Set up Printful API client with authentication
- Implement product creation endpoints
- Configure webhook handlers for order updates

### Phase 2: Product Management

#### 2.1 Product Creation Flow
- Design completion webhook handler
- Product data transformation service
- Medusa product creation with variants
- Image and mockup management

#### 2.2 Pricing & Inventory
- Dynamic pricing calculation
- Profit margin configuration
- Inventory sync (POD = infinite stock)
- Currency conversion handling

### Phase 3: Order Processing

#### 3.1 Order Creation
- Cart to Printful order transformation
- Shipping address validation
- Payment confirmation handling

#### 3.2 Fulfillment Tracking
- Order status webhooks
- Tracking number updates
- Customer notification system

## Database Schema

### printful_studio_products
```sql
CREATE TABLE printful_studio_products (
  id uuid PRIMARY KEY,
  medusa_product_id varchar NOT NULL,
  printful_product_id varchar NOT NULL,
  printful_variant_id varchar NOT NULL,
  design_id varchar,
  template_id varchar,
  mockup_urls jsonb,
  print_areas jsonb,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
```

### printful_studio_sessions
```sql
CREATE TABLE printful_studio_sessions (
  id uuid PRIMARY KEY,
  artist_id varchar NOT NULL,
  session_token varchar NOT NULL,
  design_data jsonb,
  status varchar DEFAULT 'active',
  expires_at timestamp,
  created_at timestamp DEFAULT now()
);
```

## API Endpoints

### Studio Endpoints
- `POST /api/studio/session` - Initialize design session
- `POST /api/studio/complete` - Handle design completion
- `GET /api/studio/templates` - Get available templates
- `POST /api/studio/preview` - Generate product preview

### Product Endpoints
- `POST /api/products/from-studio` - Create product from design
- `PUT /api/products/studio/{id}` - Update studio product
- `GET /api/products/studio/{id}/mockups` - Get product mockups

### Order Endpoints
- `POST /api/orders/printful/create` - Create Printful order
- `GET /api/orders/printful/{id}/status` - Get order status
- `POST /api/webhooks/printful/order-update` - Handle order updates

## Implementation Checklist

### Backend Services
- [ ] Printful Studio Service
- [ ] Design Management Service
- [ ] Product Creation Service
- [ ] Mockup Generator Service
- [ ] Order Fulfillment Service
- [ ] Webhook Handler Service
- [ ] Pricing Calculator Service

### Frontend Components
- [ ] Studio Embed Component
- [ ] Design Gallery Component
- [ ] Product Preview Component
- [ ] Template Selector Component
- [ ] Pricing Configuration Component

### Database & Models
- [ ] Studio product models
- [ ] Session management models
- [ ] Design storage models
- [ ] Update existing product models

### Integration Points
- [ ] Printful API authentication
- [ ] Studio iframe integration
- [ ] Webhook endpoints
- [ ] Order synchronization
- [ ] Image CDN integration

## Configuration

### Environment Variables
```env
PRINTFUL_API_KEY=your_api_key
PRINTFUL_STUDIO_KEY=studio_key
PRINTFUL_WEBHOOK_SECRET=webhook_secret
PRINTFUL_STORE_ID=store_id
STUDIO_IFRAME_URL=https://studio.printful.com
```

### Studio Configuration
```typescript
const studioConfig = {
  templateCategories: ['apparel', 'accessories', 'home'],
  defaultTemplates: ['t-shirt', 'hoodie', 'mug'],
  profitMargin: 0.30, // 30% markup
  currency: 'USD',
  locale: 'en_US'
};
```

## Security Considerations
- Validate all webhook payloads
- Secure session token storage
- Rate limiting on API endpoints
- CORS configuration for iframe
- Input validation and sanitization

## Testing Strategy
- Unit tests for services
- Integration tests for API endpoints
- E2E tests for complete workflow
- Webhook payload testing
- Error handling scenarios

## Monitoring & Logging
- Studio session tracking
- Order fulfillment metrics
- API call monitoring
- Error logging and alerting
- Performance metrics

## Documentation
- API documentation
- Studio integration guide
- Artist onboarding guide
- Troubleshooting guide
- FAQ section