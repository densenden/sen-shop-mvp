# Sen-Commerce Backend

## Overview

Custom Medusa.js v2 backend with artwork management module, file upload capabilities, and extended admin interface.

## Architecture

### Core Components

1. **Artwork Module** (`src/modules/artwork-module/`)
   - Custom module for managing digital artworks
   - Integrates with Medusa's product system
   - Supports collections and categorization

2. **API Routes** (`src/api/`)
   - Admin endpoints for CRUD operations
   - Store endpoints for public access
   - File upload endpoint with Multer

3. **Admin Extensions** (`src/admin/`)
   - Custom React pages for artwork management
   - Integrated file upload with Supabase
   - Product linking interface

## Technical Implementation

### Module System

The artwork module follows Medusa v2 patterns:

```typescript
// Module definition
export default Module(ARTWORK_MODULE, {
  imports: [MedusaModule],
  providers: [ImageUploadService],
  models: [Artwork, ArtworkCollection],
})
```

### Service Layer

Using MedusaService for auto-generated CRUD:

```typescript
class ArtworkModuleService extends MedusaService({
  Artwork,
  ArtworkCollection,
}) {}
```

This automatically provides:
- `listArtworks()`, `createArtworks()`, `updateArtworks()`, `deleteArtworks()`
- `listArtworkCollections()`, `createArtworkCollections()`, etc.

### Database Schema

**Artwork Table:**
- `id` (uuid)
- `title` (varchar)
- `description` (text, nullable)
- `image_url` (varchar)
- `artwork_collection_id` (uuid, FK)
- `product_ids` (text[])
- `created_at`, `updated_at`, `deleted_at` (timestamps)

**ArtworkCollection Table:**
- `id` (uuid)
- `name` (varchar)
- `description` (text, nullable)
- `topic` (varchar)
- `purpose` (varchar)
- `thumbnail_url` (varchar)
- `midjourney_version` (varchar)
- `month_created` (varchar)
- `created_at`, `updated_at`, `deleted_at` (timestamps)

### File Upload System

Implemented custom upload service:

1. **Multer Middleware**: Handles multipart/form-data
2. **Supabase Integration**: Stores images in cloud storage
3. **URL Generation**: Returns public URLs for display

```typescript
// Upload endpoint
router.post("/uploads", upload.array("files"), async (req, res) => {
  const uploadService = req.scope.resolve("imageUploadService")
  const files = await uploadService.upload(req.files)
  res.json({ files })
})
```

### Admin UI Integration

Extended Medusa admin with custom routes:

```typescript
// Route configuration
export const config = defineRouteConfig({
  label: "Artworks",
  icon: Photo,
})
```

Pages include:
- `/artworks` - List view with thumbnails
- `/artworks/new` - Create form with upload
- `/artworks/[id]` - Edit form
- `/artwork-collections` - Collection management

## Key Learnings

### 1. Medusa Service Conventions
- Always use plural method names (e.g., `createArtworks` not `createArtwork`)
- Methods accept both single objects and arrays
- Built-in pagination and filtering

### 2. Database Migrations
- Medusa expects specific columns (timestamps)
- Manual SQL migrations needed for existing tables
- Foreign keys managed through decorators

### 3. Module Registration
- Modules must be registered in `medusa-config.ts`
- Path must be relative to project root
- Module exports must follow specific structure

### 4. API Development
- Admin routes require authentication
- Use `req.scope.resolve()` for dependency injection
- Always include `credentials: "include"` in frontend

## Environment Setup

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/medusa-db

# Storage
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SUPABASE_BUCKET_NAME=artworks

# Frontend env vars need VITE_ prefix
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Development Commands

```bash
# Start dev server
npm run dev

# Run migrations
npx medusa db:migrate

# Build for production
npm run build

# Start production server
npm start
```

## Project Status

### Completed
- ✅ Artwork CRUD operations
- ✅ Collection management
- ✅ File upload to Supabase
- ✅ Admin UI integration
- ✅ Product linking
- ✅ API endpoints

### In Progress
- 🔄 Collection edit pages
- 🔄 Bulk operations
- 🔄 Advanced filtering

### Planned
- 📋 Image optimization
- 📋 CDN integration
- 📋 Caching layer
- 📋 GraphQL API

## Integrations & API Docs

- [Printful v2 API Integration](./src/modules/artwork-module/README.printful-v2.md)

---

Built with Medusa.js v2.8.4
Last updated: January 2025
