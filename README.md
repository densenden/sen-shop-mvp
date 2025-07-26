

# SenShop MVP - Digital Art & Print-on-Demand Platform

A modern e-commerce platform built with Medusa.js v2 and Next.js, specializing in digital artworks with print-on-demand integration.

## 🚀 Features

### Core E-commerce
- ✅ **Product Catalog** - Browse artworks and products with filtering
- ✅ **Shopping Cart** - Add, remove, and manage cart items
- ✅ **Checkout Flow** - Complete order processing with Stripe
- ✅ **Order Management** - Track orders and download digital products
- ✅ **User Authentication** - Account creation and management

### Artwork Management
- ✅ **Digital Artworks** - Upload and manage artwork collections
- ✅ **Product Sync** - Automatic product creation from artworks
- ✅ **Collection Organization** - Group artworks by topic and purpose
- ✅ **Metadata Management** - Rich artwork information and tagging

### Print-on-Demand
- ✅ **Printful Integration** - Automatic POD product creation
- ✅ **Mockup Generation** - Product previews with artwork
- ✅ **Order Fulfillment** - Automatic order forwarding to Printful
- ✅ **Webhook Handling** - Real-time order status updates

### Digital Downloads
- ✅ **Secure Downloads** - Token-based file access
- ✅ **File Management** - Supabase storage integration
- ✅ **Download Tracking** - Monitor download usage
- ✅ **Format Options** - Multiple file format support

## 🏗️ Architecture

## Architecture Overview

```
├── sen-commerce/          # Medusa.js backend
│   ├── modules/          # Custom modules
│   │   ├── artwork-module/
│   │   └── digital-product/
│   ├── api/              # REST endpoints
│   ├── admin/            # Admin UI extensions
│   └── workflows/        # Business logic workflows
│
└── frontend/             # Next.js storefront
    ├── components/
    └── pages/
```

## Key Learning Points

### 1. Medusa.js Module System
- Medusa v2 uses a modular architecture where functionality is organized into modules
- Each module contains models, services, and migrations
- MedusaService auto-generates CRUD operations from entity definitions
- Module registration happens in `medusa-config.ts`
- **Important**: MedusaService generates pluralized method names (e.g., `createDigitalProducts` not `createDigitalProduct`)
- Custom modules must be marked as `isQueryable: true` in config

### 2. Database & ORM
- Medusa uses MikroORM/TypeORM for database management
- Entities are defined with decorators (@Entity, @Property, etc.)
- Relations are handled through @ManyToOne, @OneToMany decorators
- Migrations are auto-generated but sometimes need manual SQL for existing tables
- **Medusa v2 Change**: Models use `model.define()` instead of decorators
- **Important**: Don't define `created_at` and `updated_at` - they're auto-added
- Primary keys must be explicitly marked with `.primaryKey()`

### 3. Custom Module Implementation

Created two custom modules:

#### Artwork Module
Manages physical artwork collections and images:

**Artwork Model:**
```typescript
- id: string (auto-generated)
- title: string
- description: text (nullable)
- image_url: string
- artwork_collection_id: string (foreign key)
- product_ids: array<string>
- timestamps (created_at, updated_at, deleted_at)
```

**ArtworkCollection Model:**
```typescript
- id: string (auto-generated)
- name: string
- description: text (nullable)
- topic: string
- purpose: enum (artwork, merchandise, present, wallart, other)
- thumbnail_url: string
- midjourney_version: string
- month_created: string
- timestamps
```

#### Digital Product Module
Handles downloadable products with secure file management:

**DigitalProduct Model:**
```typescript
- id: string (auto-generated)
- name: string
- file_url: string (Supabase storage URL)
- file_key: string (storage path)
- file_size: number (bytes)
- mime_type: string
- description: text (nullable)
- preview_url: string (nullable)
- max_downloads: number (default: -1 unlimited)
- expires_at: date (nullable)
- timestamps
```

**DigitalProductDownload Model:**
```typescript
- id: string (auto-generated)
- digital_product_id: string (foreign key)
- order_id: string
- customer_id: string
- token: string (unique, for secure downloads)
- download_count: number
- last_downloaded_at: date
- expires_at: date
- is_active: boolean
- timestamps
```

### 4. API Development

**Admin Routes:**
- `/admin/artworks` - CRUD operations for artworks
- `/admin/artwork-collections` - CRUD for collections
- `/admin/digital-products` - CRUD for digital products
- `/admin/products/:id/digital-products` - Link digital products to regular products
- `/admin/uploads` - File upload endpoint using Multer

**Store Routes:**
- `/store/artworks` - Public API with product enrichment
- `/store/download/:token` - Secure digital product download endpoint

### 5. File Upload Integration

Implemented Supabase integration for image storage:
- Created custom upload service using @supabase/supabase-js
- Multer middleware for handling multipart/form-data
- Images stored in Supabase bucket with public URLs
- Environment variables for secure credential management

### 6. Admin UI Extension

Extended Medusa's admin panel with custom React pages:
- List views with data tables
- Create/edit forms with file upload
- Used Medusa UI components for consistency
- Route configuration with defineRouteConfig

## Technical Challenges & Solutions

### Challenge 1: Module Service Method Names
**Issue:** Expected `createArtworkCollection` but Medusa auto-generates `createArtworkCollections` (plural)
**Solution:** Always use pluralized method names with MedusaService

### Challenge 2: Database Relations
**Issue:** "Could not resolve 'find'" errors with custom repositories
**Solution:** Use MedusaService's built-in functionality instead of custom repositories

### Challenge 3: Missing Timestamps
**Issue:** Tables missing timestamp columns that Medusa expects
**Solution:** Created SQL migration to add columns to existing tables

### Challenge 4: File Upload in Admin
**Issue:** No built-in file upload in Medusa admin
**Solution:** Created custom upload endpoint and integrated with Supabase

### Challenge 5: Supabase RLS Policies
**Issue:** "new row violates row-level security policy" error
**Solution:** Either disable RLS on bucket or create proper policies

### Challenge 6: Module Registration in v2
**Issue:** "Service digitalProductModuleService was not found"
**Solution:** Add `isQueryable: true` to module config in medusa-config.ts

### Challenge 7: Model Primary Keys
**Issue:** "entity is missing @PrimaryKey()"
**Solution:** Use `.primaryKey()` on id field in model.define()

### Challenge 8: Workflow Syntax
**Issue:** "WorkflowResponse is not a constructor"
**Solution:** Return plain object from workflow, not new WorkflowResponse()

## Project Structure Details

### Backend Structure
```
src/
├── modules/
│   ├── artwork-module/
│   │   ├── models/
│   │   ├── services/
│   │   └── index.ts
│   └── digital-product/
│       ├── models/
│       │   ├── digital-product.ts
│       │   └── digital-product-download.ts
│       ├── services/
│       │   ├── digital-product-module-service.ts
│       │   └── file-upload-service.ts
│       └── index.ts
├── api/
│   ├── admin/
│   │   ├── artworks/
│   │   ├── artwork-collections/
│   │   ├── digital-products/
│   │   └── uploads/
│   ├── store/
│   │   ├── artworks/
│   │   └── download/[token]/
│   └── middlewares.ts
├── admin/
│   └── routes/
│       ├── artworks/
│       ├── artwork-collections/
│       └── digital-products/
├── workflows/
│   └── send-digital-products.ts
└── subscribers/
    └── order-completed.ts
```

### Key Technologies Used
- **Medusa.js v2**: E-commerce backend framework
- **TypeScript**: Type safety throughout the project
- **PostgreSQL**: Primary database
- **Supabase**: File storage and image hosting
- **React**: Admin UI components
- **Multer**: File upload middleware

## Environment Configuration

Required environment variables:
```
DATABASE_URL=postgres://...
MEDUSA_ADMIN_ONBOARDING_TYPE=default
STORE_CORS=http://localhost:8000
ADMIN_CORS=http://localhost:9000
AUTH_CORS=http://localhost:9000
REDIS_URL=redis://localhost:6379

# Supabase for file storage
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
SUPABASE_BUCKET_NAME=artworks

# Frontend needs these prefixed with VITE_
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

## Development Workflow

1. **Backend Development**: Work in `/sen-commerce` directory
2. **Run Development Server**: `npm run dev` (starts on port 9000)
3. **Access Admin Panel**: http://localhost:9000/app
4. **Database Migrations**: Auto-run on server start
5. **File Uploads**: Handled through `/admin/uploads` endpoint

## Current State

### What's Working
- ✅ Artwork CRUD operations
- ✅ Collection management
- ✅ Image upload to Supabase
- ✅ Admin UI for managing artworks
- ✅ Product linking functionality
- ✅ API endpoints for frontend
- ✅ Digital product uploads (50MB limit)
- ✅ File size validation (client & server)
- ✅ Secure download system with tokens
- ✅ Digital product listing page

### Known Issues
- ❌ Digital product detail/edit page missing
- ❌ No upload progress indicator
- ❌ No link between products and digital products UI
- ❌ Download workflow not integrated with orders
- Browser console shows "playback state" errors (from dev tools, not app code)

## Digital Products Implementation

### Features
- **File Upload**: Up to 50MB files with real-time validation
- **Storage**: Supabase bucket integration (public bucket "print")
- **Security**: Token-based download system
- **Tracking**: Download count and expiry management
- **Admin UI**: Upload and manage digital files

### Implementation Details
- **Multer Middleware**: Handles multipart form uploads
- **File Types**: PDF, JPG, PNG, ZIP, MP3, MP4, Excel, Word
- **Download Tokens**: Crypto-generated unique tokens
- **Expiry**: Default 7-day download links

### Relevant Links
- Admin Digital Products: http://localhost:9000/app/digital-products
- Upload New: http://localhost:9000/app/digital-products/new
- API Docs: See `/admin/digital-products` routes

## Next Steps

1. ✅ ~~Frontend Development~~: Build the customer-facing store
2. ✅ ~~Product Integration~~: Link artworks to actual products
3. **Payment Processing**: Stripe integration
4. ✅ ~~Digital Downloads~~: Secure download system (implemented)
5. **Order Management**: Complete fulfillment workflows
6. **Digital Product Enhancements**:
   - Edit page for existing products
   - Upload progress indicator
   - Bulk operations
   - Download analytics dashboard

## Technical Insights

### Medusa Service Pattern
MedusaService creates methods following this pattern:
- `list[Entity]s()` - List with filters
- `create[Entity]s()` - Create (accepts array or single)
- `update[Entity]s()` - Update by ID
- `delete[Entity]s()` - Delete by ID
- `retrieve[Entity]()` - Get single by ID

### Database Conventions
- All tables need `id`, `created_at`, `updated_at`, `deleted_at`
- Foreign keys follow pattern: `[entity]_id`
- Many-to-many through array columns or join tables

### Admin UI Patterns
- Pages export default component and `config`
- Use `defineRouteConfig` for route configuration
- Medusa UI components for consistency
- API calls need `credentials: "include"`

---

Last Updated: January 2025
Built with Medusa.js v2.8.4


