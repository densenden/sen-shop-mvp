#!/bin/bash

# Railway Production Deployment Script for Sen Commerce Backend
# IMPORTANT: Fill in your production Supabase credentials before running!

echo "🚂 Deploying Sen Commerce Backend to Railway (PRODUCTION)..."
echo "⚠️  Make sure you've created your production Supabase project first!"
echo ""

# FILL IN YOUR PRODUCTION SUPABASE CREDENTIALS HERE
# Get these from your new Supabase project dashboard
PRODUCTION_SUPABASE_PROJECT_REF="YOUR_PROJECT_REF"  # e.g., "abcdefghijklmnop"
PRODUCTION_DATABASE_PASSWORD="YOUR_DATABASE_PASSWORD"
PRODUCTION_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
PRODUCTION_SUPABASE_SERVICE_KEY="YOUR_SERVICE_ROLE_KEY"
PRODUCTION_S3_ACCESS_KEY="YOUR_S3_ACCESS_KEY"
PRODUCTION_S3_SECRET_KEY="YOUR_S3_SECRET_KEY"

# Verify required variables are set
if [ "$PRODUCTION_SUPABASE_PROJECT_REF" = "YOUR_PROJECT_REF" ]; then
    echo "❌ ERROR: Please fill in your Supabase production credentials first!"
    echo "   Edit this file and replace the placeholder values."
    exit 1
fi

# Set environment variables
echo "📝 Setting production environment variables..."

# CORS Settings - Production domains  
railway variables --set "STORE_CORS=https://sen-commerce-irb6nlw4p-studiosen.vercel.app,https://your-custom-domain.com"
railway variables --set "ADMIN_CORS=https://sen-commerce-irb6nlw4p-studiosen.vercel.app,https://your-backend-railway.app"
railway variables --set "AUTH_CORS=https://sen-commerce-irb6nlw4p-studiosen.vercel.app,https://your-backend-railway.app"

# Security Secrets - Generate strong production secrets
railway variables set JWT_SECRET="$(openssl rand -base64 32)"
railway variables set COOKIE_SECRET="$(openssl rand -base64 32)"

# Node Environment
railway variables set NODE_ENV="production"
railway variables set PORT="9000"

# Database - Production Supabase connection pooler
railway variables set DATABASE_URL="postgresql://postgres.${PRODUCTION_SUPABASE_PROJECT_REF}:${PRODUCTION_DATABASE_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"

# Supabase Configuration
railway variables set SUPABASE_URL="https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co"
railway variables set SUPABASE_ANON_KEY="${PRODUCTION_SUPABASE_ANON_KEY}"
railway variables set SUPABASE_SERVICE_ROLE_KEY="${PRODUCTION_SUPABASE_SERVICE_KEY}"

# S3 Storage Configuration (Supabase)
railway variables set S3_BUCKET="artworks"
railway variables set S3_REGION="auto"
railway variables set S3_ENDPOINT="https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co/storage/v1/s3"
railway variables set S3_FILE_URL="https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/"
railway variables set S3_ACCESS_KEY_ID="${PRODUCTION_S3_ACCESS_KEY}"
railway variables set S3_SECRET_ACCESS_KEY="${PRODUCTION_S3_SECRET_KEY}"

# Printful Configuration (Production)
railway variables set PRINTFUL_API_TOKEN="YOUR_PRINTFUL_API_TOKEN"

# Stripe Payment Configuration (Test - replace with live keys for production)
railway variables set STRIPE_API_KEY="YOUR_STRIPE_API_KEY"
railway variables set STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY"
railway variables set STRIPE_WEBHOOK_SECRET="whsec_WILL_BE_SET_AFTER_WEBHOOK_CREATION"
railway variables set STRIPE_PUBLISHABLE_KEY="YOUR_STRIPE_PUBLISHABLE_KEY"

# SendGrid Configuration
railway variables set SENDGRID_API_KEY="YOUR_SENDGRID_API_KEY"
railway variables set SENDGRID_FROM="shop@sen.studio"
railway variables set STORE_URL="https://sen-commerce-backend.railway.app"

# Medusa Store API Key
railway variables set MEDUSA_PUBLISHABLE_KEY="YOUR_MEDUSA_PUBLISHABLE_KEY"

# Admin Configuration
railway variables set MEDUSA_ADMIN_ONBOARDING_TYPE="default"

echo ""
echo "✅ All production environment variables set!"
echo ""
echo "🚀 Deploying to Railway..."
railway up

echo ""
echo "✅ Deployment initiated! Next steps:"
echo ""
echo "1. Get your Railway domain:"
echo "   railway domain"
echo ""
echo "2. Run database migrations:"
echo "   railway run npm run medusa -- db:migrate"
echo ""
echo "3. Seed initial data (optional):"
echo "   railway run npm run seed:artwork"
echo ""
echo "4. Update Vercel environment variables with your Railway URL"
echo ""
echo "5. Configure Stripe webhooks and update STRIPE_WEBHOOK_SECRET"
echo ""
echo "📝 Remember to update:"
echo "   - STORE_CORS with your production domain"
echo "   - Stripe keys from test to live when ready"
echo "   - Custom domain in Railway dashboard"