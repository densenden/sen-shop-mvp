#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this after your Railway backend is deployed

echo "🔧 Setting up Vercel environment variables..."
echo ""

# Get Railway backend URL first
echo "⚠️  You need your Railway backend URL first!"
echo "   Run 'railway domain' in your backend directory to get it"
echo ""
read -p "Enter your Railway backend URL (e.g., https://sen-commerce-production.up.railway.app): " BACKEND_URL

if [ -z "$BACKEND_URL" ]; then
    echo "❌ ERROR: Backend URL is required!"
    exit 1
fi

# Set production environment variables
echo "📝 Setting production environment variables in Vercel..."

# Backend URL
vercel env add NEXT_PUBLIC_MEDUSA_BACKEND_URL production <<< "$BACKEND_URL"

# Medusa Publishable Key
vercel env add NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY production <<< "pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0"

# Stripe Publishable Key (Test - replace with live for production)
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production <<< "pk_test_51Rnzd61lR99M6TMt31w8lD2llVscKHKB71Udbm7G9TrxXyVyevSE0hNMqTTOWxE1hctUu7vMG8FjuUhpSFimhgH300nCBBNSHV"

# Environment indicator
vercel env add NEXT_PUBLIC_ENVIRONMENT production <<< "production"

echo ""
echo "✅ Environment variables set!"
echo ""
echo "🚀 Redeploying to Vercel with new environment..."
vercel --prod

echo ""
echo "✅ Complete! Your production environment is set up:"
echo "   - Frontend: https://sen-commerce-irb6nlw4p-studiosen.vercel.app"
echo "   - Backend: $BACKEND_URL"
echo ""
echo "📝 Next steps:"
echo "1. Test the connection by visiting your storefront"
echo "2. Check browser console for any errors"
echo "3. Configure custom domains when ready"