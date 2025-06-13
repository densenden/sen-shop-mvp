# Artwork Module Implementation

## Overview

Custom Medusa v2 module for managing digital artworks with collections, product linking, and cloud storage integration.

## Technical Stack

- **Framework**: Medusa.js v2.8.4
- **Database**: PostgreSQL with MikroORM
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

### Artwork Entity

```typescript
@Entity({ tableName: "artwork" })
export class Artwork {
  @PrimaryKey({ columnType: "text" })
  id: string

  @Property({ columnType: "text" })
  title: string

  @Property({ columnType: "text", nullable: true })
  description?: string

  @Property({ columnType: "text" })
  image_url: string

  @Property({ columnType: "text", nullable: true })
  artwork_collection_id?: string

  @ManyToOne(() => ArtworkCollection, { nullable: true })
  artwork_collection?: ArtworkCollection

  @Property({ columnType: "text[]", default: [] })
  product_ids: string[] = []

  @Property({ columnType: "timestamptz", defaultRaw: "CURRENT_TIMESTAMP" })
  created_at: Date

  @Property({ columnType: "timestamptz", defaultRaw: "CURRENT_TIMESTAMP", onUpdate: () => new Date() })
  updated_at: Date

  @Property({ columnType: "timestamptz", nullable: true })
  deleted_at?: Date | null
}
```

### ArtworkCollection Entity

```typescript
@Entity({ tableName: "artwork_collection" })
export class ArtworkCollection {
  @PrimaryKey({ columnType: "text" })
  id: string

  @Property({ columnType: "text" })
  name: string

  @Property({ columnType: "text", nullable: true })
  description?: string

  @Property({ columnType: "text", nullable: true })
  topic?: string

  @Property({ columnType: "text", nullable: true })
  purpose?: string

  @Property({ columnType: "text", nullable: true })
  thumbnail_url?: string

  @Property({ columnType: "text", nullable: true })
  midjourney_version?: string

  @Property({ columnType: "text", nullable: true })
  month_created?: string

  @OneToMany(() => Artwork, artwork => artwork.artwork_collection)
  artworks = new Collection<Artwork>(this)

  // Timestamps handled same as Artwork
}
```

## Service Implementation

### MedusaService Pattern

```typescript
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

### Auto-generated Tables

Medusa handles table creation through MikroORM migrations.

### Manual Migration for Timestamps

For existing tables missing timestamps:

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