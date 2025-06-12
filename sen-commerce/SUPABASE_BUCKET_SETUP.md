# 🪣 Supabase Storage Bucket Configuration Guide

## Updating Bucket Settings After Creation

### Via Supabase Dashboard (Recommended)

1. **Navigate to Storage**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Click "Storage" in the left sidebar

2. **Find Your Bucket**
   - Locate the `artworks` bucket
   - Click the **gear icon** (⚙️) next to the bucket name

3. **Update MIME Type Restrictions**
   
   **Option A: Add More File Types**
   ```
   image/jpeg
   image/png
   image/gif
   image/webp
   text/plain        # Add this if you need text files
   application/pdf   # Add this for PDFs
   ```

   **Option B: Remove All Restrictions**
   - Clear the "Allowed MIME types" field entirely
   - This allows any file type to be uploaded

   **Option C: Keep Image-Only**
   - Keep the current settings if you only want images

4. **Other Settings You Can Update**
   - **File size limit**: Default 5MB (5242880 bytes)
   - **Public access**: Should be enabled for artwork images
   - **Download**: Enable if you want direct downloads

5. **Save Changes**
   - Click "Update bucket" to apply changes

### Via Supabase SQL Editor (Advanced)

```sql
-- View current bucket configuration
SELECT * FROM storage.buckets WHERE name = 'artworks';

-- Update allowed MIME types (example)
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain']
WHERE name = 'artworks';

-- Remove all MIME type restrictions
UPDATE storage.buckets 
SET allowed_mime_types = NULL
WHERE name = 'artworks';

-- Update file size limit (10MB example)
UPDATE storage.buckets 
SET file_size_limit = 10485760
WHERE name = 'artworks';
```

## Testing Your Configuration

After updating, run the setup script again to verify:

```bash
npm run setup:supabase
```

You should see:
```
✅ Bucket "artworks" already exists
Testing bucket accessibility...
✅ Bucket test successful
```

## Common Issues

### "Invalid MIME type" Error
- Your bucket has strict MIME type restrictions
- Solution: Add the required MIME type or remove restrictions

### "Row-level security policy" Error
- You're using an anon key that can't modify buckets
- Solution: Use service role key or update via Dashboard

### "Bucket not found" Error
- The bucket doesn't exist yet
- Solution: Create it manually or use service role key

## Security Considerations

1. **Public Buckets**
   - Anyone can read files with the URL
   - Good for: Product images, artwork displays
   - Bad for: Private documents

2. **MIME Type Restrictions**
   - Prevents unwanted file types
   - Recommended: Keep image-only for artwork bucket
   - Consider separate buckets for different file types

3. **File Size Limits**
   - Prevents excessive storage usage
   - 5MB is good for web images
   - Increase for high-res artwork files

## Best Practices

1. **Use Separate Buckets** for different purposes:
   ```
   artworks     - Public images (restricted MIME types)
   documents    - Private PDFs (authenticated access)
   avatars      - User profile pictures (public, small size)
   ```

2. **Set Appropriate Limits**:
   - Images: 5-10MB
   - Documents: 10-50MB
   - Avatars: 1-2MB

3. **Use RLS Policies** for fine-grained access control
4. **Monitor Storage Usage** in Supabase Dashboard 