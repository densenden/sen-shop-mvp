# SenShop Deployment Guide

## Production Environment Setup

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Redis instance
- Supabase project
- Stripe account
- Printful account
- Domain with SSL certificate

### 1. Backend Deployment (Medusa)

#### Railway Deployment

1. **Prepare environment variables:**
   ```bash
   cp sen-commerce/.env.production.template sen-commerce/.env.production
   # Fill in all required values
   ```

2. **Build the application:**
   ```bash
   cd sen-commerce
   npm ci --production=false
   npm run build
   ```

3. **Deploy to Railway:**
   - Connect GitHub repository
   - Set environment variables from `.env.production`
   - Configure PostgreSQL and Redis add-ons
   - Set build command: `npm run build`
   - Set start command: `npm start`

#### Alternative: Docker Deployment

```dockerfile
# Backend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build
EXPOSE 9000
CMD ["npm", "start"]
```

### 2. Frontend Deployment (Next.js)

#### Vercel Deployment

1. **Prepare environment variables:**
   ```bash
   cp sen-commerce-storefront/.env.production.template sen-commerce-storefront/.env.production
   # Fill in all required values
   ```

2. **Build and deploy:**
   ```bash
   cd sen-commerce-storefront
   npm ci
   npm run build
   ```

3. **Deploy to Vercel:**
   - Connect GitHub repository
   - Set environment variables from `.env.production`
   - Set build command: `npm run build`
   - Set output directory: `.next`

#### Alternative: Docker Deployment

```dockerfile
# Frontend Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 3. Database Setup

#### PostgreSQL Production Setup

```sql
-- Create production database
CREATE DATABASE senshop_production;
CREATE USER senshop_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE senshop_production TO senshop_user;

-- Enable required extensions
\c senshop_production;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

#### Run Migrations

```bash
cd sen-commerce
npm run medusa -- db:migrate
npm run seed:artwork
```

### 4. Supabase Configuration

#### Storage Buckets

Create the following buckets in Supabase:

1. **artworks** (public) - for artwork previews
2. **digital-products** (private) - for digital downloads
3. **thumbnails** (public) - for collection thumbnails

#### Policies

```sql
-- Artworks bucket (public read)
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'artworks');

-- Digital products bucket (authenticated access)
CREATE POLICY "Allow authenticated read access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'digital-products' AND 
  auth.role() = 'authenticated'
);

-- Thumbnails bucket (public read)
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');
```

### 5. Stripe Configuration

#### Webhook Endpoints

Configure webhooks in Stripe Dashboard:

1. **Payment Intent Succeeded**
   - URL: `https://api.yourdomain.com/webhooks/stripe/payment-intent-succeeded`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

2. **Order Events**
   - URL: `https://api.yourdomain.com/webhooks/stripe/orders`
   - Events: `invoice.payment_succeeded`, `customer.subscription.created`

### 6. Printful Configuration

#### Webhook Setup

1. **Order Status Updates**
   - URL: `https://api.yourdomain.com/webhooks/printful/order-updated`
   - Events: Order status changes

2. **Product Updates**
   - URL: `https://api.yourdomain.com/webhooks/printful/product-updated`
   - Events: Product catalog changes

### 7. Domain & SSL Setup

#### DNS Configuration

```
A     api.yourdomain.com     -> Backend IP
A     www.yourdomain.com     -> Frontend IP
CNAME yourdomain.com        -> www.yourdomain.com
```

#### SSL Certificates

- Use Let's Encrypt for free SSL certificates
- Configure automatic renewal
- Ensure HTTPS redirect is enabled

### 8. Monitoring & Analytics

#### Health Checks

Create health check endpoints:

- Backend: `https://api.yourdomain.com/health`
- Frontend: `https://yourdomain.com/api/health`

#### Logging

Configure structured logging:

```javascript
// Add to medusa-config.ts
export default {
  // ... other config
  plugins: [
    {
      resolve: "@medusajs/logger",
      options: {
        level: "info",
        enableConsole: true,
        enableFile: true
      }
    }
  ]
}
```

### 9. Performance Optimization

#### CDN Setup

- Configure CloudFlare or AWS CloudFront
- Cache static assets (images, CSS, JS)
- Enable gzip compression

#### Database Optimization

```sql
-- Add database indexes for better performance
CREATE INDEX idx_products_status ON product(status);
CREATE INDEX idx_orders_created_at ON "order"(created_at);
CREATE INDEX idx_cart_items_cart_id ON line_item(cart_id);
```

### 10. Security Checklist

- [ ] All environment variables are properly secured
- [ ] Database access is restricted
- [ ] API endpoints are properly authenticated
- [ ] CORS is configured for production domains only
- [ ] Webhook endpoints are secured with proper secrets
- [ ] Rate limiting is implemented
- [ ] Input validation is in place
- [ ] File upload restrictions are configured

### 11. Backup Strategy

#### Database Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U senshop_user senshop_production > backup_$DATE.sql
aws s3 cp backup_$DATE.sql s3://your-backup-bucket/database/
```

#### Supabase Backups

- Enable automatic backups in Supabase dashboard
- Configure retention policy
- Test restore procedures

### 12. Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting SenShop deployment..."

# Backend deployment
echo "📦 Building backend..."
cd sen-commerce
npm ci --production=false
npm run build

echo "🗄️ Running database migrations..."
npm run medusa -- db:migrate

# Frontend deployment  
echo "🎨 Building frontend..."
cd ../sen-commerce-storefront
npm ci
npm run build

echo "✅ Deployment completed successfully!"
```

### 13. Post-Deployment Verification

1. **Test API endpoints:**
   ```bash
   curl https://api.yourdomain.com/store/products
   curl https://api.yourdomain.com/admin/auth
   ```

2. **Test frontend:**
   - Load homepage
   - Browse products
   - Add items to cart
   - Complete checkout flow

3. **Test webhooks:**
   - Process test payment
   - Verify Printful integration
   - Check order notifications

### 14. Monitoring & Alerts

#### Setup Monitoring

- **Uptime monitoring:** Use services like Pingdom or UptimeRobot
- **Error tracking:** Configure Sentry for both frontend and backend
- **Performance monitoring:** Use tools like New Relic or DataDog
- **Log aggregation:** Use services like LogRocket or Papertrail

#### Alert Configuration

- API response time > 2 seconds
- Error rate > 1%
- Database connection failures
- Payment processing failures
- Webhook delivery failures

### Support & Maintenance

- Schedule regular security updates
- Monitor performance metrics
- Regular database maintenance
- Backup verification
- Load testing for peak traffic

---

**Important:** Always test the deployment process in a staging environment before deploying to production.