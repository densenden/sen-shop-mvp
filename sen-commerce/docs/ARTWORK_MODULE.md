# Artwork Module Implementation

> **Note:** This documentation is now Medusa v2 style only. MikroORM is no longer used in this project. All models and migrations should follow Medusa v2 conventions.

## Overview

Custom Medusa v2 module for managing digital artworks with collections, product linking, and cloud storage integration.

## Technical Stack

- **Framework**: Medusa.js v2.8.4
- **Database**: PostgreSQL (Medusa v2 style)
- **Storage**: Supabase (cloud file storage)
- **Admin UI**: React with Medusa UI components
- **File Upload**: Multer middleware

## Module Structure

```
artwork-module/
├── models/
│   ├── artwork.ts
│   ├── artwork-collection.ts
│   └── index.ts
├── services/
│   ├── artwork-module-service.ts
│   └── image-upload-service.ts
├── types/
│   └── index.ts
└── index.ts
```

## Database Design

### Artwork Entity (Medusa v2 style)

```typescript
import { model } from "@medusajs/framework/utils"

export const Artwork = model.define("artwork", {
  id: model.id().primaryKey(),
  title: model.text(),
  description: model.text().nullable(),
  image_url: model.text(),
  artwork_collection_id: model.text(),
  product_ids: model.json().nullable(),
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
  deleted_at: model.dateTime().nullable(),
})
```

### ArtworkCollection Entity (Medusa v2 style)

```typescript
import { model } from "@medusajs/framework/utils"

export const ArtworkCollection = model.define("artwork_collection", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
  topic: model.text().nullable(),
  purpose: model.text().nullable(),
  thumbnail_url: model.text().nullable(),
  midjourney_version: model.text().nullable(),
  month_created: model.text().nullable(),
  created_at: model.dateTime().default(() => new Date()),
  updated_at: model.dateTime().default(() => new Date()),
  deleted_at: model.dateTime().nullable(),
})
```

## Service Implementation

### MedusaService Pattern

```typescript
import { MedusaService } from "@medusajs/framework/utils"
import { Artwork, ArtworkCollection } from "../models"

class ArtworkModuleService extends MedusaService({
  Artwork,
  ArtworkCollection,
}) {}
```

This generates:
- `listArtworks(filters, config)`
- `createArtworks(data)`
- `updateArtworks(selector, data)`
- `deleteArtworks(ids)`
- `retrieveArtwork(id, config)`

Same pattern for ArtworkCollection.

### Image Upload Service

```typescript
export class ImageUploadService {
  constructor(private logger: Logger) {}

  async upload(files: Express.Multer.File[]): Promise<UploadedFile[]> {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    return Promise.all(files.map(async (file) => {
      const fileName = `${Date.now()}-${file.originalname}`
      const { data, error } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME!)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME!)
        .getPublicUrl(data.path)

      return {
        url: publicUrl,
        key: data.path,
        size: file.size,
        mimetype: file.mimetype
      }
    }))
  }
}
```

## API Implementation

### Admin Routes

```typescript
// GET /admin/artworks
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  const artworks = await artworkModuleService.listArtworks({
    relations: ["artwork_collection"]
  })
  res.json({ artworks })
}

// POST /admin/artworks
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const artworkModuleService = req.scope.resolve(ARTWORK_MODULE)
  const artwork = await artworkModuleService.createArtworks(req.body)
  res.json(artwork)
}
```

### File Upload Route

```typescript
const upload = multer({ storage: multer.memoryStorage() })

router.post("/uploads", upload.array("files"), async (req, res) => {
  const uploadService = req.scope.resolve("imageUploadService")
  const files = await uploadService.upload(req.files as Express.Multer.File[])
  res.json({ files })
})
```

## Admin UI Implementation

### List Page Component

```typescript
const ArtworksList = () => {
  const [artworks, setArtworks] = useState([])

  const fetchArtworks = async () => {
    const response = await fetch("/admin/artworks", {
      credentials: "include",
    })
    const data = await response.json()
    setArtworks(data.artworks || [])
  }

  return (
    <Container>
      <Table>
        {/* Table implementation */}
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Artworks",
  icon: Photo,
})
```

### Create/Edit Form

Key features:
- File upload with drag & drop
- Collection selection dropdown
- Product multi-select
- Form validation
- Progress indicators

## Database Migrations

Medusa v2 can generate migrations for you, or you can use plain SQL files. Example for adding timestamps:

```sql
ALTER TABLE artwork 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE artwork_collection
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
```

## Configuration

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

### Environment Variables

```bash
# Supabase Configuration
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
SUPABASE_BUCKET_NAME=artworks

# Frontend Variables (with VITE_ prefix)
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
```

## Implementation Challenges

### 1. Service Method Naming
- **Issue**: Expected singular method names, but MedusaService generates plural
- **Resolution**: Always use plural (e.g., `createArtworks` not `createArtwork`)

### 2. Repository Pattern
- **Issue**: Custom repositories caused "Could not resolve" errors
- **Resolution**: Use MedusaService's built-in functionality

### 3. Timestamp Columns
- **Issue**: Medusa expects timestamp columns that weren't auto-created
- **Resolution**: Manual SQL migration to add required columns

### 4. File Upload Integration
- **Issue**: No built-in file upload in Medusa admin
- **Resolution**: Custom Multer endpoint with Supabase integration

### 5. Relations in API
- **Issue**: Related data not included by default
- **Resolution**: Specify relations in list queries

## Performance Considerations

- **Image Storage**: Direct upload to Supabase, no local storage
- **Database Queries**: Indexed foreign keys for collection relations
- **API Response**: Pagination available through MedusaService
- **File Size**: Limited by Multer configuration (default 5MB)

## Security

- **Authentication**: Admin routes protected by Medusa's auth system
- **File Upload**: MIME type validation, size limits
- **Storage**: Supabase bucket with public read access
- **API Access**: CORS configured for admin domain only

---

Module Version: 1.0.0  
Last Updated: January 2025 