# Digital Products Module

## Overview

The Digital Products module provides comprehensive functionality for selling downloadable products through Medusa. It integrates with Supabase for file storage and includes secure token-based downloads, admin management UI, and order fulfillment workflows.

## Features

- **File Upload Management**: Support for PDFs, images, audio, video, and documents up to 50MB
- **Secure Downloads**: Token-based access with expiration and download limits
- **Admin Interface**: Full CRUD operations with upload progress tracking
- **Storage Integration**: Supabase bucket integration with public/private options
- **Order Integration**: Automatic download link generation after purchase
- **Analytics**: Track download counts and access patterns

## Technical Architecture

### Module Structure

```
digital-product/
├── models/
│   ├── digital-product.ts       # Main product entity
│   └── digital-product-download.ts  # Download tracking
├── services/
│   ├── digital-product-module-service.ts  # Core business logic
│   └── file-upload-service.ts            # Supabase integration
├── migrations/
│   └── Migration20250118100000.ts        # Database schema
└── index.ts                              # Module export
```

### Data Models

#### DigitalProduct
- Stores file metadata and settings
- Links to Supabase storage
- Supports download limits and expiration

#### DigitalProductDownload
- Tracks individual download access
- Manages secure tokens
- Records download history

## API Endpoints

### Admin APIs

```
GET    /admin/digital-products          # List all digital products
POST   /admin/digital-products          # Upload new digital product
GET    /admin/digital-products/:id      # Get single product
PUT    /admin/digital-products/:id      # Update product settings
DELETE /admin/digital-products/:id      # Delete product and file

POST   /admin/products/:id/digital-products    # Link to product
DELETE /admin/products/:id/digital-products    # Unlink from product
```

### Store APIs

```
GET    /store/download/:token           # Download file with token
```

## Implementation Guide

### 1. Environment Setup

```bash
# Supabase Configuration
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=[anon-key]

# Supabase S3 Configuration (optional)
S3_FILE_URL=https://[project].supabase.co/storage/v1/object/public
S3_ACCESS_KEY_ID=[access-key]
S3_SECRET_ACCESS_KEY=[secret-key]
S3_BUCKET=print
S3_ENDPOINT=https://[project].supabase.co/storage/v1/s3
```

### 2. Supabase Bucket Setup

1. Create a public bucket named "print" in Supabase
2. Either disable RLS or add upload policies:

```sql
-- Allow authenticated uploads
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'print');
```

### 3. Database Setup

Run the migration or execute manually:

```sql
-- Digital products table
CREATE TABLE digital_product (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    file_key VARCHAR NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR NOT NULL,
    description TEXT,
    preview_url VARCHAR,
    max_downloads INTEGER DEFAULT -1,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Download tracking table  
CREATE TABLE digital_product_download (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    digital_product_id VARCHAR NOT NULL REFERENCES digital_product(id) ON DELETE CASCADE,
    order_id VARCHAR NOT NULL,
    customer_id VARCHAR NOT NULL,
    token VARCHAR UNIQUE NOT NULL,
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_digital_product_download_token ON digital_product_download(token);
CREATE INDEX idx_digital_product_download_order ON digital_product_download(order_id);
CREATE INDEX idx_digital_product_download_customer ON digital_product_download(customer_id);
```

### 4. Module Configuration

In `medusa-config.ts`:

```typescript
modules: [
  {
    resolve: "./src/modules/digital-product",
    alias: "digitalProductModuleService",
    definition: {
      isQueryable: true  // Required for custom modules
    }
  }
]
```

## Usage Examples

### Upload a Digital Product

```javascript
// Admin UI or API
const formData = new FormData()
formData.append('name', 'Premium Artwork')
formData.append('description', 'High-res digital file')
formData.append('file', fileObject)

fetch('/admin/digital-products', {
  method: 'POST',
  credentials: 'include',
  body: formData
})
```

### Generate Download Access

```javascript
// In order completion workflow
const downloadAccess = await digitalProductService.createDownloadAccess({
  digital_product_id: "prod_123",
  order_id: "order_456",
  customer_id: "cust_789",
  expires_in_days: 30
})

// Returns token for download URL
const downloadUrl = `${STORE_URL}/download/${downloadAccess.token}`
```

### Customer Download

```javascript
// Customer accesses /store/download/:token
// System validates token and redirects to file
```

## Security Considerations

1. **Token Generation**: Uses crypto.randomBytes(32) for secure tokens
2. **Expiration**: Default 7-day expiry, configurable per product
3. **Download Limits**: Optional max download count per purchase
4. **File Access**: Direct Supabase URLs for public buckets, signed URLs for private
5. **Validation**: Server-side file size and type validation

## Performance Optimization

1. **File Upload**: Streams directly to Supabase, no local storage
2. **Progress Tracking**: Real-time upload progress with XMLHttpRequest
3. **Database Indexes**: Optimized for token lookups and order queries
4. **Caching**: Consider CDN for frequently accessed files

## Troubleshooting

### Common Issues

1. **RLS Policy Error**
   - Error: "new row violates row-level security policy"
   - Solution: Check Supabase bucket policies

2. **Large File Uploads**
   - Error: File size exceeds limit
   - Solution: Increase Multer limits in middleware

3. **Missing Tables**
   - Error: "relation digital_product does not exist"
   - Solution: Run migrations or manual SQL

## Future Enhancements

1. **Bulk Operations**: Upload multiple files at once
2. **Preview Generation**: Auto-generate thumbnails
3. **Analytics Dashboard**: Download statistics
4. **Versioning**: Track file versions
5. **Watermarking**: Add watermarks to preview files
6. **Download Resumption**: Support partial downloads
7. **Email Integration**: Automated download emails

---

Module Version: 1.0.0  
Compatible with: Medusa v2.8.4+  
Last Updated: January 2025 