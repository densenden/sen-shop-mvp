

# SenShop MVP - Technical Documentation

## What I Built

A custom e-commerce platform for selling digital artworks as both downloads and physical products. The project integrates Medusa.js (commerce backend), Next.js (frontend), and Supabase (file storage) to create a complete artwork marketplace.

## Architecture Overview

```
├── sen-commerce/          # Medusa.js backend
│   ├── modules/          # Custom modules
│   ├── api/              # REST endpoints
│   └── admin/            # Admin UI extensions
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

### 2. Database & ORM
- Medusa uses MikroORM/TypeORM for database management
- Entities are defined with decorators (@Entity, @Property, etc.)
- Relations are handled through @ManyToOne, @OneToMany decorators
- Migrations are auto-generated but sometimes need manual SQL for existing tables

### 3. Custom Module Implementation

Created an artwork module with two main entities:

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

### 4. API Development

**Admin Routes:**
- `/admin/artworks` - CRUD operations for artworks
- `/admin/artwork-collections` - CRUD for collections
- `/admin/uploads` - File upload endpoint using Multer

**Store Routes:**
- `/store/artworks` - Public API with product enrichment

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

## Project Structure Details

### Backend Structure
```
src/
├── modules/artwork-module/
│   ├── models/
│   │   ├── artwork.ts
│   │   └── artwork-collection.ts
│   ├── services/
│   │   ├── artwork-module-service.ts
│   │   └── image-upload-service.ts
│   └── index.ts
├── api/
│   ├── admin/
│   │   ├── artworks/
│   │   ├── artwork-collections/
│   │   └── uploads/
│   └── store/
│       └── artworks/
└── admin/
    └── routes/
        ├── artworks/
        └── artwork-collections/
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

### Known Issues
- Browser console shows "playback state" errors (from dev tools, not app code)
- Collection edit page not yet implemented
- No bulk operations yet

## Next Steps

1. **Frontend Development**: Build the customer-facing store
2. **Product Integration**: Link artworks to actual products
3. **Payment Processing**: Stripe integration
4. **Digital Downloads**: Secure download system
5. **Order Management**: Fulfillment workflows

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


