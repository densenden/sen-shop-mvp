# SenShop MVP - Product Requirements Document (PRD)
## Complete Project Restart from Scratch

### Date: July 13, 2025
### Version: 1.0
### Status: Planning

---

## 1. Project Overview

### 1.1 Vision
Development of a modern e-commerce platform for digital artworks with print-on-demand integration. The platform enables the sale of artworks both as digital downloads and physical products.

### 1.2 Target Audience
- Digital artists and art collectors
- Customers who want to purchase both digital and physical artworks
- Administrators for managing artworks and collections

### 1.3 Core Features
- **Artwork Management**: Management of digital artworks and collections
- **Dual Commerce**: Sales as digital downloads and physical products
- **Print-on-Demand**: Integration with Printful for physical product manufacturing
- **Secure Downloads**: Token-based download management
- **Modern UI**: Responsive design based on Fashion-Starter template

---

## 2. Technical Architecture

### 2.1 Tech Stack
- **Backend**: Medusa.js v2.8.4+ (E-commerce Framework)
- **Frontend**: Next.js v15+ (React-based Storefront)
- **Database**: PostgreSQL
- **File Storage**: Supabase (Images and digital downloads)
- **Print-on-Demand**: Printful API v2 Beta
- **Styling**: Tailwind CSS
- **Deployment**: Railway/Vercel

### 2.2 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    SenShop Architecture                     │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)                                         │
│  ├── Storefront                                            │
│  ├── Admin Dashboard                                       │
│  └── API Integration                                       │
├─────────────────────────────────────────────────────────────┤
│  Backend (Medusa.js)                                        │
│  ├── Custom Modules                                        │
│  │   ├── Artwork Module                                    │
│  │   ├── Digital Product Module                           │
│  │   └── Printful Integration Module                      │
│  ├── API Endpoints                                         │
│  └── Workflow Engine                                       │
├─────────────────────────────────────────────────────────────┤
│  External Services                                          │
│  ├── Supabase (Database + Storage)                         │
│  ├── Printful (Print-on-Demand)                           │
│  └── Stripe (Payment Processing)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Project Setup and Workflow

### 3.1 Prerequisites
- **New Supabase Instance**: Fresh database and storage buckets
- **Printful Account**: API access and product catalog
- **Development Environment**: Node.js 18+, PostgreSQL, Redis

### 3.2 Setup Sequence

#### Phase 1: Core Infrastructure (Week 1-2)
1. **Create Supabase Project**
   - Provision new Postgres database
   - Set up storage buckets:
     - `artworks` (public for artwork previews)
     - `digital-products` (private for downloads)
     - `thumbnails` (public for collection thumbnails)
   - Configure Row Level Security (RLS)
   - Generate API keys

2. **Initialize Medusa.js Backend**
   - Create new Medusa.js v2 instance
   - Configure database connection
   - Set up Redis for caching
   - Start development server

3. **Basic Configuration**
   - Define environment variables
   - CORS settings for frontend
   - Set up admin panel access

#### Phase 2: Custom Modules (Week 2-3)
1. **Artwork Module**
   - Define data models (Artwork, ArtworkCollection)
   - Implement CRUD services
   - Create admin API endpoints
   - Execute database migrations

2. **Digital Product Module**
   - Create digital product models
   - Secure download token system
   - File upload service with Supabase
   - Implement download tracking

3. **Printful Integration Module**
   - Printful API v2 integration
   - Product synchronization
   - Webhook handlers for order status
   - Mockup generation

#### Phase 3: Admin Interface (Week 3-4)
1. **Medusa Admin Extensions**
   - Artwork management pages
   - Collection management
   - Digital product management
   - File upload interface

2. **Printful Integration in Admin**
   - Product catalog overview
   - Artwork-to-product linking
   - Order tracking
   - Sync dashboard

#### Phase 4: Storefront (Week 4-6)
1. **Next.js Storefront based on Fashion-Starter**
   - Responsive design system
   - Product catalog pages
   - Artwork detail pages
   - Shopping cart functionality

2. **E-commerce Features**
   - Checkout process
   - User authentication
   - Order tracking
   - Customer download area

#### Phase 5: Integration and Testing (Week 6-7)
1. **End-to-End Integration**
   - Payment flow with Stripe
   - Order processing
   - Download provisioning
   - Printful order forwarding

2. **Testing and Optimization**
   - Unit tests for critical functions
   - E2E tests for order process
   - Performance optimization
   - Error handling

#### Phase 6: Deployment (Week 7-8)
1. **Production Environment**
   - Production environment variables
   - SSL certificates
   - Domain configuration
   - Monitoring setup

2. **Go-Live Preparation**
   - Backup strategies
   - Security audit
   - Documentation
   - Support processes

---

## 4. Data Model

### 4.1 Artwork Collection
```typescript
ArtworkCollection {
  id: string (PK)
  name: string
  description: text
  topic: string
  purpose: enum (artwork, merchandise, present, wallart, other)
  thumbnail_url: string
  midjourney_version: string
  month_created: string
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp
}
```

### 4.2 Artwork
```typescript
Artwork {
  id: string (PK)
  title: string
  description: text
  image_url: string
  artwork_collection_id: string (FK)
  product_ids: array<string>
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp
}
```

### 4.3 Digital Product
```typescript
DigitalProduct {
  id: string (PK)
  name: string
  file_url: string
  file_key: string
  file_size: number
  mime_type: string
  description: text
  preview_url: string
  max_downloads: number
  expires_at: timestamp
  created_at: timestamp
  updated_at: timestamp
  deleted_at: timestamp
}
```

### 4.4 Digital Product Download
```typescript
DigitalProductDownload {
  id: string (PK)
  digital_product_id: string (FK)
  order_id: string
  customer_id: string
  token: string (unique)
  download_count: number
  last_downloaded_at: timestamp
  expires_at: timestamp
  is_active: boolean
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 5. API Specification

### 5.1 Admin API Endpoints

#### Artworks
- `GET /admin/artworks` - List all artworks
- `POST /admin/artworks` - Create new artwork
- `GET /admin/artworks/:id` - Get single artwork
- `PUT /admin/artworks/:id` - Update artwork
- `DELETE /admin/artworks/:id` - Delete artwork

#### Artwork Collections
- `GET /admin/artwork-collections` - List all collections
- `POST /admin/artwork-collections` - Create new collection
- `GET /admin/artwork-collections/:id` - Get single collection
- `PUT /admin/artwork-collections/:id` - Update collection
- `DELETE /admin/artwork-collections/:id` - Delete collection

#### Digital Products
- `GET /admin/digital-products` - List all digital products
- `POST /admin/digital-products` - Create new digital product
- `GET /admin/digital-products/:id` - Get single digital product
- `PUT /admin/digital-products/:id` - Update digital product
- `DELETE /admin/digital-products/:id` - Delete digital product

#### File Upload
- `POST /admin/uploads` - File upload endpoint for images and digital products

### 5.2 Storefront API Endpoints

#### Public Endpoints
- `GET /store/artworks` - Public artwork list
- `GET /store/artwork-collections` - Public collection list
- `GET /store/products` - Product catalog with artwork links

#### Secure Download
- `GET /store/download/:token` - Token-based download endpoint

---

## 6. Supabase Configuration

### 6.1 Required Resources
- **Postgres Database**: Main database for Medusa.js
- **Storage Buckets**:
  - `artworks` (public, for artwork previews)
  - `digital-products` (private, for downloads)
  - `thumbnails` (public, for collection thumbnails)

### 6.2 Setup Steps
1. **Create New Supabase Project**
   ```bash
   # Supabase CLI Installation
   npm install -g @supabase/cli
   
   # Create new project
   supabase init
   supabase start
   ```

2. **Database Setup**
   ```sql
   -- Medusa.js requires specific extensions
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   ```

3. **Create Storage Buckets**
   ```typescript
   // Create buckets via Supabase Dashboard or API
   const buckets = [
     { name: 'artworks', public: true },
     { name: 'digital-products', public: false },
     { name: 'thumbnails', public: true }
   ];
   ```

4. **Configure Row Level Security**
   ```sql
   -- Example RLS policy for artworks bucket
   CREATE POLICY "Allow public read access" ON storage.objects
   FOR SELECT USING (bucket_id = 'artworks');
   ```

### 6.3 Environment Variables
```env
# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# Bucket Names
SUPABASE_ARTWORK_BUCKET=artworks
SUPABASE_DIGITAL_BUCKET=digital-products
SUPABASE_THUMBNAIL_BUCKET=thumbnails
```

---

## 7. Printful Integration

### 7.1 Setup Requirements
- **Printful Account**: Developer access required
- **API Token**: Private token for API authentication
- **Webhook Endpoints**: For order status updates

### 7.2 Integration Steps
1. **Set up API Connection**
   ```typescript
   // Printful API v2 Client
   const printfulClient = new PrintfulClient({
     token: process.env.PRINTFUL_API_TOKEN,
     version: 'v2'
   });
   ```

2. **Synchronize Product Catalog**
   ```typescript
   // Fetch catalog products
   const products = await printfulClient.get('/v2/catalog-products');
   ```

3. **Implement Webhook Handlers**
   ```typescript
   // Webhook for order status updates
   app.post('/webhooks/printful/order-updated', handleOrderUpdate);
   ```

### 7.3 Workflow Integration
1. **Order Creation**: Automatic forwarding to Printful
2. **Mockup Generation**: Product previews with artwork
3. **Status Updates**: Real-time updates via webhooks
4. **Fulfillment Tracking**: Tracking from production to shipping

---

## 8. Frontend Design (Fashion-Starter Based)

### 8.1 Design System
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS for Utility-First approach
- **Components**: Modular, reusable React components
- **Responsiveness**: Mobile-First design

### 8.2 Page Structure
```
├── Homepage
│   ├── Hero Section with Featured Artworks
│   ├── Collection Preview
│   └── Latest Artworks
├── Catalog
│   ├── Artwork Overview
│   ├── Filters (Collection, Price, Format)
│   └── Search Function
├── Artwork Detail
│   ├── High-Resolution Artwork View
│   ├── Product Options (Digital/Print)
│   └── Shopping Cart Integration
├── Collections
│   ├── Collection Overview
│   └── Collection Detail Pages
├── Checkout
│   ├── Shopping Cart Overview
│   ├── User Information
│   └── Payment Integration
├── User Dashboard
│   ├── Order History
│   ├── Download Area
│   └── Account Management
└── Admin Area
    ├── Artwork Management
    ├── Order Management
    └── Analytics
```

### 8.3 Design Principles
- **Minimalist Aesthetic**: Focus on artwork presentation
- **Intuitive Navigation**: User-friendly menu guidance
- **Performance**: Optimized image loading and caching
- **Accessibility**: WCAG-compliant implementation

---

## 9. Risks and Mitigation

### 9.1 Technical Risks
- **API Changes**: Printful v2 Beta status
  - *Mitigation*: Abstraction layer for API calls
- **Supabase Limits**: Storage and request limits
  - *Mitigation*: Monitoring and scaling plan
- **Medusa.js Updates**: Framework stability
  - *Mitigation*: Versioning and testing

### 9.2 Business Risks
- **Printful Dependency**: Single point of failure
  - *Mitigation*: Evaluate backup POD providers
- **Licensing**: Artwork rights and usage
  - *Mitigation*: Clear licensing agreements

### 9.3 Security Risks
- **Download Protection**: Unauthorized access to digital products
  - *Mitigation*: Token-based authentication
- **Payment Security**: PCI compliance
  - *Mitigation*: Stripe integration for secure payments

---

## 10. Timeline and Milestones

### 10.1 Project Timeline (8 Weeks)
```
Week 1-2: Core Infrastructure
├── Supabase Setup
├── Medusa.js Installation
└── Basic Configuration

Week 2-3: Backend Development
├── Custom Modules
├── API Development
└── Printful Integration

Week 3-4: Admin Interface
├── Medusa Admin Extensions
├── File Upload System
└── Printful Dashboard

Week 4-6: Frontend Development
├── Fashion-Starter Integration
├── Storefront Components
└── E-commerce Features

Week 6-7: Integration & Testing
├── End-to-End Tests
├── Performance Optimization
└── Security Audit

Week 7-8: Deployment & Go-Live
├── Production Environment
├── Monitoring Setup
└── Documentation
```

### 10.2 Critical Milestones
- **Week 2**: Backend modules functional
- **Week 4**: Admin interface complete
- **Week 6**: Storefront MVP ready
- **Week 8**: Production-ready application

---

## 11. Success Metrics

### 11.1 Technical KPIs
- **Performance**: Page load times < 3 seconds
- **Availability**: 99.9% uptime
- **Security**: Zero critical vulnerabilities
- **Scalability**: Support for 10,000+ artworks

### 11.2 Business KPIs
- **Conversion Rate**: Visitors to buyers
- **Average Order Value**: Average order value
- **Customer Satisfaction**: Ratings and feedback
- **Download Success Rate**: Successful digital downloads

---

## 12. Resources and Documentation

### 12.1 Official Documentation
- **Supabase**: https://supabase.com/docs
  - Database Setup: https://supabase.com/docs/guides/database
  - Storage: https://supabase.com/docs/guides/storage
  - Authentication: https://supabase.com/docs/guides/auth

- **Medusa.js**: https://docs.medusajs.com/
  - V2 Getting Started: https://docs.medusajs.com/v2
  - Custom Modules: https://docs.medusajs.com/v2/basics/modules-and-services
  - Admin Extensions: https://docs.medusajs.com/v2/admin-development

- **Printful**: https://developers.printful.com/docs/v2-beta/
  - API Reference: https://developers.printful.com/docs/v2-beta/api-reference
  - Webhooks: https://developers.printful.com/docs/v2-beta/webhooks
  - Order Management: https://developers.printful.com/docs/v2-beta/orders

### 12.2 Design Reference
- **Fashion-Starter**: https://github.com/Agilo/fashion-starter
  - Demo: https://fashion-starter-demo.vercel.app/
  - Komponenten: https://github.com/Agilo/fashion-starter/tree/main/components
  - Styling: https://github.com/Agilo/fashion-starter/tree/main/styles

### 12.3 Additional Resources
- **Next.js**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Stripe**: https://stripe.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## 13. Next Steps

### 13.1 Immediate Actions
1. **Create Supabase Project** - New instance with fresh database
2. **Prepare Development Environment** - Local setup for Medusa.js
3. **Structure Repository** - Monorepo with backend and frontend
4. **Initial Migrations** - Database schema for custom modules

### 13.2 Week 1 Priorities
- Configure Supabase buckets
- Initialize Medusa.js backend
- Test basic API endpoints
- Establish development workflow

### 13.3 Long-term Considerations
- **Scaling**: Eventual microservices migration
- **Internationalization**: Multi-language support
- **Mobile App**: React Native for iOS/Android
- **AI Integration**: Automatic artwork categorization

---

## Appendix: Environment Variables Template

```env
# Medusa.js Core
DATABASE_URL=postgresql://postgres:password@localhost:5432/senshop
REDIS_URL=redis://localhost:6379
MEDUSA_ADMIN_ONBOARDING_TYPE=default
STORE_CORS=http://localhost:3000,https://yourdomain.com
ADMIN_CORS=http://localhost:7001,https://admin.yourdomain.com
AUTH_CORS=http://localhost:7001,https://admin.yourdomain.com
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret

# Supabase
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
SUPABASE_ARTWORK_BUCKET=artworks
SUPABASE_DIGITAL_BUCKET=digital-products
SUPABASE_THUMBNAIL_BUCKET=thumbnails

# Printful
PRINTFUL_API_TOKEN=[your-printful-token]
PRINTFUL_WEBHOOK_SECRET=[webhook-secret]
PRINTFUL_ENVIRONMENT=sandbox # oder production

# Stripe
STRIPE_SECRET_KEY=[stripe-secret-key]
STRIPE_PUBLISHABLE_KEY=[stripe-publishable-key]
STRIPE_WEBHOOK_SECRET=[stripe-webhook-secret]

# Frontend (Next.js)
NEXT_PUBLIC_MEDUSA_API_URL=http://localhost:9000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[stripe-publishable-key]
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]

# Optional: Monitoring & Analytics
SENTRY_DSN=[sentry-dsn]
GOOGLE_ANALYTICS_ID=[ga-id]
```

---

**Created on**: July 13, 2025  
**Author**: SenShop Development Team  
**Version**: 1.0  
**Status**: Ready for Implementation