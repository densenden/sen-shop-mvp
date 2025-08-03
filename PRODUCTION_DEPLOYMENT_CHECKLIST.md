# 📋 Production Deployment Checklist

## Phase 1: Supabase Setup ✅

- [ ] Create new Supabase project named `sen-commerce-production`
- [ ] Save database password securely
- [ ] Create storage buckets:
  - [ ] `artworks` (public)
  - [ ] `digital-products` (private)
  - [ ] `thumbnails` (public)
- [ ] Run SQL policies from `SUPABASE_PRODUCTION_SETUP.md`
- [ ] Generate S3 access keys
- [ ] Copy all credentials:
  - [ ] Project Reference ID
  - [ ] Database password
  - [ ] Anon key
  - [ ] Service role key
  - [ ] S3 access key ID
  - [ ] S3 secret access key

## Phase 2: Railway Backend Deployment

- [ ] Navigate to backend: `cd sen-commerce`
- [ ] Login to Railway: `railway login`
- [ ] Link project: `railway link -p ce6736c4-fc0c-4acc-946a-dc04ec59a161`
- [ ] Edit `railway-deploy-production.sh` with your Supabase credentials:
  ```bash
  PRODUCTION_SUPABASE_PROJECT_REF="your_project_ref"
  PRODUCTION_DATABASE_PASSWORD="your_password"
  PRODUCTION_SUPABASE_ANON_KEY="your_anon_key"
  PRODUCTION_SUPABASE_SERVICE_KEY="your_service_key"
  PRODUCTION_S3_ACCESS_KEY="your_s3_access_key"
  PRODUCTION_S3_SECRET_KEY="your_s3_secret_key"
  ```
- [ ] Run deployment: `./railway-deploy-production.sh`
- [ ] Get Railway domain: `railway domain`
- [ ] Save Railway URL: ________________________

## Phase 3: Database Setup

- [ ] Run migrations: `railway run npm run medusa -- db:migrate`
- [ ] Seed initial data: `railway run npm run seed:artwork`
- [ ] Verify database connection: `railway logs`

## Phase 4: Vercel Frontend Configuration

- [ ] Navigate to frontend: `cd ../sen-commerce-storefront`
- [ ] Run setup script: `./vercel-env-setup.sh`
- [ ] Enter Railway backend URL when prompted
- [ ] Wait for redeployment to complete

## Phase 5: Verification

- [ ] Visit frontend: https://sen-commerce-irb6nlw4p-studiosen.vercel.app
- [ ] Check browser console for errors
- [ ] Test API connection:
  ```bash
  curl https://your-railway-url.railway.app/health
  curl https://your-railway-url.railway.app/store/products
  ```
- [ ] Try loading products on frontend
- [ ] Test cart functionality

## Phase 6: Stripe Webhook Configuration

- [ ] Go to Stripe Dashboard > Webhooks
- [ ] Add endpoint: `https://your-railway-url.railway.app/webhooks/stripe`
- [ ] Select events:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
- [ ] Copy webhook signing secret
- [ ] Update on Railway:
  ```bash
  railway variables set STRIPE_WEBHOOK_SECRET="whsec_your_secret"
  ```

## Phase 7: Final Configuration

- [ ] Remove development banner:
  - Edit `app/page.tsx`
  - Remove the development version banner div
  - Commit and push
- [ ] Configure custom domains (optional):
  - [ ] Add custom domain in Vercel
  - [ ] Add custom domain in Railway
  - [ ] Update CORS settings
- [ ] Set up monitoring:
  - [ ] Railway metrics
  - [ ] Vercel analytics
  - [ ] Supabase monitoring

## Production Environment Variables Summary

### Railway (Backend)
- ✅ All database connections
- ✅ Supabase API keys
- ✅ S3 storage credentials
- ✅ Stripe keys
- ✅ SendGrid configuration
- ✅ CORS settings

### Vercel (Frontend)
- ✅ Backend URL
- ✅ Medusa publishable key
- ✅ Stripe publishable key
- ✅ Environment indicator

## Troubleshooting

### Common Issues:

1. **CORS errors**
   - Update `STORE_CORS` on Railway to include Vercel URL
   - Redeploy Railway: `railway up`

2. **Database connection failed**
   - Check connection pooler URL format
   - Verify password is correct
   - Check Supabase dashboard for connection limits

3. **Products not loading**
   - Check migrations ran successfully
   - Verify API key configuration
   - Check browser console for errors

4. **Storage not working**
   - Verify S3 credentials are correct
   - Check bucket policies in Supabase
   - Test with Supabase dashboard upload

## Success Criteria

- [ ] Frontend loads without errors
- [ ] Products display correctly
- [ ] Cart functionality works
- [ ] Images load from Supabase storage
- [ ] No CORS errors in console
- [ ] Backend health check returns 200