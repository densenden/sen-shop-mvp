# 🚀 Supabase Production Setup Guide

## Step 1: Create New Supabase Project for Production

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Configure:
   - **Name**: `sen-commerce-production`
   - **Database Password**: Generate a strong password and save it!
   - **Region**: Choose closest to your users (e.g., `eu-central-1`)
   - **Plan**: Choose your plan (Free tier works for testing)

## Step 2: Configure Storage Buckets

Once project is created, go to Storage section and create these buckets:

### 1. `artworks` bucket (PUBLIC)
```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('artworks', 'artworks', true);
```

### 2. `digital-products` bucket (PRIVATE)
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('digital-products', 'digital-products', false);
```

### 3. `thumbnails` bucket (PUBLIC)
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('thumbnails', 'thumbnails', true);
```

## Step 3: Set Storage Policies

Run these in the SQL Editor:

```sql
-- Allow public read access to artworks
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'artworks');

-- Allow public read access to thumbnails  
CREATE POLICY "Public read access thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');

-- Allow authenticated read access to digital products
CREATE POLICY "Authenticated read access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'digital-products' AND 
  auth.role() = 'authenticated'
);

-- Allow service role to manage all buckets
CREATE POLICY "Service role full access" ON storage.objects
FOR ALL USING (auth.role() = 'service_role');
```

## Step 4: Get Your Credentials

Go to Settings > API in your Supabase dashboard:

### Database Connection
- **Connection string**: Found in Settings > Database
- **Pooler URL**: Use the "Connection pooling" tab (Transaction mode)
  - Format: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres`

### API Keys
- **Project URL**: `https://[PROJECT_REF].supabase.co`
- **Anon Key**: `eyJhbGc...` (public key)
- **Service Role Key**: `eyJhbGc...` (secret key - keep secure!)

### Storage S3 Credentials
Go to Settings > Storage > S3 Access Keys:
1. Click "Generate new access keys"
2. Save the Access Key ID and Secret Access Key

### Your Production Variables:
```bash
# Database
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[REGION].pooler.supabase.com:6543/postgres"

# Supabase API
SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# S3 Storage
S3_ACCESS_KEY_ID="[YOUR_ACCESS_KEY]"
S3_SECRET_ACCESS_KEY="[YOUR_SECRET_KEY]"
S3_ENDPOINT="https://[PROJECT_REF].supabase.co/storage/v1/s3"
S3_FILE_URL="https://[PROJECT_REF].supabase.co/storage/v1/object/public/"
S3_BUCKET="artworks"
S3_REGION="auto"
```

## Step 5: Enable Required Extensions

Run in SQL Editor:
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable trigram for search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

## Step 6: Configure Medusa Database Tables

The Medusa migration will create all necessary tables when you run:
```bash
railway run npm run medusa -- db:migrate
```

## Important Notes:

1. **Save all credentials securely** - you won't be able to see the Service Role Key again
2. **Use connection pooler URL** for production to handle connection limits
3. **Set up Row Level Security (RLS)** for any custom tables
4. **Enable point-in-time recovery** in production settings
5. **Monitor your usage** in the Supabase dashboard

## Next Steps:
1. Update `railway-deploy-production.sh` with your new credentials
2. Run the deployment script
3. Migrate the database
4. Test all connections