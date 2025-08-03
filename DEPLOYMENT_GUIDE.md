# 🚀 Sen Commerce Deployment Guide

## Current Status

✅ **Frontend (Storefront)**: Deployed to Vercel  
- URL: https://sen-commerce-irb6nlw4p-studiosen.vercel.app
- Development banner: Added ✅

🔧 **Backend (Medusa)**: Ready for Railway deployment

## Railway Backend Deployment Steps

### 1. Login to Railway
```bash
cd sen-commerce
railway login
```

### 2. Link your project
```bash
railway link -p ce6736c4-fc0c-4acc-946a-dc04ec59a161
```

### 3. Deploy using the script
```bash
./railway-deploy.sh
```

### 4. Set sensitive environment variables in Railway Dashboard
Go to your Railway project dashboard and add:
- `S3_FILE_URL`: Your Supabase storage URL (e.g., https://xxx.supabase.co/storage/v1/object/public/)
- `S3_ACCESS_KEY_ID`: From Supabase project settings
- `S3_SECRET_ACCESS_KEY`: From Supabase project settings  
- `S3_ENDPOINT`: Your Supabase S3 endpoint (e.g., https://xxx.supabase.co/storage/v1/s3)
- `PRINTFUL_API_TOKEN`: Your Printful API token
- `STRIPE_SECRET_KEY`: Your Stripe secret key

### 5. Get your Railway domain
```bash
railway domain
```

### 6. Update Vercel environment variable
```bash
cd ../sen-commerce-storefront
vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL production
# Enter your Railway URL (e.g., https://sen-commerce-backend.railway.app)
```

### 7. Redeploy Vercel frontend
```bash
vercel --prod
```

### 8. Run database migrations
```bash
cd ../sen-commerce
railway run npm run medusa -- db:migrate
railway run npm run seed:artwork
```

## Verification Steps

1. **Check backend health**: 
   ```
   curl https://your-railway-url.railway.app/health
   ```

2. **Check frontend connection**:
   Visit https://sen-commerce-irb6nlw4p-studiosen.vercel.app and check browser console

3. **Test API**:
   ```
   curl https://your-railway-url.railway.app/store/products
   ```

## Troubleshooting

- **CORS errors**: Check STORE_CORS includes your Vercel URL
- **Database errors**: Ensure PostgreSQL addon is attached in Railway
- **Redis errors**: Ensure Redis addon is attached in Railway
- **404 errors**: Check that migrations have run successfully

## Next Steps

1. Remove development banner when ready for production
2. Set up custom domain
3. Configure production Stripe webhooks
4. Set up monitoring and alerts