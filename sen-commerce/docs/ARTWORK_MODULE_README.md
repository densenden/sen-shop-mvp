# Artwork Module - Technical Documentation

> **Note:** This documentation is now Medusa v2 style only. MikroORM is no longer used in this project. All models and migrations should follow Medusa v2 conventions.

## Module Overview

Custom Medusa v2 module implementing artwork management with Supabase storage integration.

## Implementation Details

### Core Components

1. **Models**: Artwork and ArtworkCollection entities using Medusa v2 `model.define()`
2. **Services**: MedusaService-based CRUD operations and image upload handling
3. **API Routes**: Admin and store endpoints for artwork management
4. **Admin UI**: React-based interface extending Medusa admin panel

### Database Schema

**artwork table**
```sql
id                    TEXT PRIMARY KEY
title                 TEXT NOT NULL
description           TEXT
image_url             TEXT NOT NULL
artwork_collection_id TEXT REFERENCES artwork_collection(id)
product_ids           JSONB
created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
deleted_at            TIMESTAMPTZ
```

**artwork_collection table**
```sql
id             TEXT PRIMARY KEY
name           TEXT NOT NULL
description    TEXT
topic          TEXT
purpose        TEXT
thumbnail_url  TEXT
midjourney_version TEXT
month_created  TEXT
created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
updated_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
deleted_at     TIMESTAMPTZ
```

### Service Architecture

```typescript
import { MedusaService } from "@medusajs/framework/utils"
import { Artwork, ArtworkCollection } from "../models"

class ArtworkModuleService extends MedusaService({
  Artwork,
  ArtworkCollection,
}) {}
```

### API Endpoints

**Admin Routes** (`/admin/`)
- `GET /artworks` - List with optional relations
- `POST /artworks` - Create single/multiple artworks
- `GET /artworks/:id` - Retrieve by ID
- `PUT /artworks/:id` - Update artwork
- `DELETE /artworks/:id` - Soft delete
- `GET /artwork-collections` - List collections
- `POST /artwork-collections` - Create collection
- `POST /uploads` - File upload endpoint

**Store Routes** (`/store/`)
- `GET /artworks` - Public listing with product enrichment

### File Upload Implementation

```typescript
// Multer configuration
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

// Upload service using Supabase
async upload(files: Express.Multer.File[]): Promise<UploadedFile[]> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  
  // Upload to Supabase storage
  const { data, error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET_NAME!)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    })
}
```

### Environment Configuration

```bash
# Required for module
DATABASE_URL=postgresql://...
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-key]
SUPABASE_BUCKET_NAME=artworks

# Required for admin UI
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

### Module Registration

In `medusa-config.ts`:
```typescript
modules: [
  {
    resolve: "./src/modules/artwork-module",
    options: {}
  }
]
```

## Database Migration Notes

If tables exist without timestamps:
```sql
ALTER TABLE artwork 
ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN deleted_at TIMESTAMPTZ;
```

## Performance Metrics

- **Upload Size**: 5MB limit per file
- **Storage**: Supabase (unlimited with usage-based pricing)
- **Query Performance**: Indexed foreign keys
- **API Response**: <100ms for typical queries

## Security Considerations

- Admin routes protected by Medusa auth
- File uploads validated by MIME type
- Supabase bucket configured for public read
- Service role key for write operations

---

Module Version: 1.0.0
Medusa Version: 2.8.4 