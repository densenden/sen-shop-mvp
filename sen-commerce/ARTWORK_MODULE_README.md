# 🎨 Artwork Module for Medusa

A complete artwork management system for Medusa v2 with Supabase storage integration.

## Features

- ✅ **Artwork Management**: Create, edit, delete artworks with images
- ✅ **Collection System**: Organize artworks into collections
- ✅ **Product Linking**: Link artworks to existing Medusa products
- ✅ **Image Storage**: Supabase storage integration with automatic uploads
- ✅ **Admin UI**: Beautiful admin interface with table views and forms
- ✅ **Store API**: Public endpoint for frontend integration

## Setup Instructions

### 1. Environment Variables

Add these to your `.env` file:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key  # Required for bucket creation
SUPABASE_BUCKET_NAME=artworks

# Admin environment variables (for frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Setup Supabase Storage

#### Option A: Automatic Setup (Requires Service Role Key)
```bash
npm run setup:supabase
```

#### Option B: Manual Setup (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to Storage
3. Click "New bucket"
4. Create a bucket named `artworks` with:
   - Public bucket: ✅ Enabled
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
   - File size limit: 5MB

### 3. Run Database Migrations

```bash
npx medusa db:migrate
```

### 4. Start the Application

```bash
npm run dev
```

## Usage

### Admin Panel

1. **Access**: Go to `http://localhost:9000/app/artworks`
2. **Create Collection**: First create artwork collections via API or admin
3. **Create Artwork**: Click "Create Artwork" button
4. **Upload Image**: Select image file (auto-uploads to Supabase)
5. **Link Products**: Select products to associate with the artwork

### API Endpoints

#### Admin API
- `GET /admin/artworks` - List all artworks
- `POST /admin/artworks` - Create new artwork
- `GET /admin/artworks/:id` - Get artwork by ID
- `PUT /admin/artworks/:id` - Update artwork
- `DELETE /admin/artworks/:id` - Delete artwork
- `GET /admin/artwork-collections` - List collections
- `POST /admin/artwork-collections` - Create collection

#### Store API
- `GET /store/artworks` - Public endpoint with product data

### Example API Usage

```javascript
// Create artwork collection
const collection = await fetch('/admin/artwork-collections', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Digital Art',
    slug: 'digital-art',
    description: 'Modern digital artworks'
  })
})

// Create artwork
const artwork = await fetch('/admin/artworks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Sunset Painting',
    description: 'Beautiful sunset over mountains',
    image_url: 'https://supabase-url/image.jpg',
    artwork_collection_id: 'collection_id',
    product_ids: ['product_1', 'product_2']
  })
})
```

## Database Schema

### Artwork Entity
```typescript
{
  id: string
  title: string
  description: string | null
  image_url: string
  artwork_collection_id: string
  product_ids: string[]
  created_at: Date
  updated_at: Date
}
```

### ArtworkCollection Entity
```typescript
{
  id: string
  title: string
  slug: string
  description: string | null
  created_at: Date
  updated_at: Date
}
```

## File Structure

```
src/
├── modules/artwork-module/
│   ├── models/
│   │   ├── artwork.ts
│   │   ├── artwork-collection.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── artwork-module-service.ts
│   │   └── image-upload-service.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── api/
│   ├── admin/
│   │   ├── artworks/
│   │   └── artwork-collections/
│   └── store/
│       └── artworks/
└── admin/
    ├── lib/
    │   ├── sdk.ts
    │   ├── image-uploader.ts
    │   └── supabase-uploader.ts
    └── routes/
        └── artworks/
            ├── page.tsx
            └── [id]/page.tsx
```

## Troubleshooting

### Bucket Creation Error: "Row-level security policy"
This error occurs when using the anon key to create buckets. Solutions:
1. **Use Service Role Key**: Set `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file
2. **Manual Creation**: Create the bucket manually in Supabase Dashboard (recommended)
3. **RLS Policies**: If you need programmatic creation, ensure your service role key has proper permissions

### Image Upload Issues
- Check Supabase credentials in environment variables
- Verify the "artworks" bucket exists in Supabase
- Ensure bucket has public access enabled
- Check RLS policies on the storage bucket

### Admin UI Not Showing
- Verify route configuration exports `defineRouteConfig`
- Check that admin build includes the custom routes
- Clear browser cache and rebuild admin

### API Errors
- Run database migrations: `npx medusa db:migrate`
- Check module registration in `medusa-config.ts`
- Verify artwork module service is properly loaded

## Next Steps

- [ ] Add image optimization and resizing
- [ ] Implement image galleries for artworks
- [ ] Add artwork categories and tags
- [ ] Create artwork search and filtering
- [ ] Add artwork analytics and views tracking 