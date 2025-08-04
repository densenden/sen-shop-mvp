# Sen-Commerce Backend

[![Production](https://img.shields.io/badge/Production-Live-green)](https://shop.sen.studio)
[![Backend](https://img.shields.io/badge/Backend-Medusa.js%20v2-blue)](https://medusajs.com)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue)](https://postgresql.org)
[![Storage](https://img.shields.io/badge/Storage-Supabase-green)](https://supabase.com)
[![POD](https://img.shields.io/badge/POD-Printful%20API-orange)](https://printful.com)
[![Deployment](https://img.shields.io/badge/Deploy-Railway-blueviolet)](https://railway.app)

**🚀 Live Production Site:** [shop.sen.studio](https://shop.sen.studio)

## Overview

Modern e-commerce backend built on Medusa.js v2 with comprehensive digital and print-on-demand product management, artwork systems, and fulfillment automation.

## Architecture

### Core Systems

1. **Digital Products** (`src/modules/digital-product/`)
   - Downloadable digital content management
   - Secure token-based file delivery
   - Access control and download limits

2. **Artwork Management** (`src/modules/artwork-module/`)
   - Digital artwork collections
   - Product-artwork relationship system
   - Supabase cloud storage integration

3. **Printful POD Integration** (`src/modules/printful/`)
   - Complete print-on-demand workflow
   - Automated order fulfillment
   - Real-time status tracking via webhooks

4. **Product Sync System** (`src/api/admin/product-sync/`)
   - POD provider synchronization
   - Bulk import/update operations
   - Real-time sync status monitoring

## Key Features

### ✅ **Digital Product System**
- Secure file upload and storage
- Download token generation
- Access control (max downloads, expiry)
- Admin UI for product management
- Automatic fulfillment on order completion

### ✅ **Artwork & Collections**
- Hierarchical artwork organization
- Multiple artwork per product support
- Professional metadata (topic, purpose, Midjourney version)
- Visual admin interface with thumbnails
- Bulk operations support

### ✅ **Printful POD Integration**
- Complete V1/V2 API integration
- Automated order processing workflow
- Product variant synchronization
- Real-time webhook status updates
- Multi-file support (designs, mockups, videos)
- Enhanced product metadata management

### ✅ **Product Sync Dashboard**
- Live sync operation monitoring
- Provider-specific sync actions
- Error tracking and reporting
- Bulk import capabilities
- Filter and search functionality

### ✅ **Admin Interface**
- Custom admin routes for all systems
- Intuitive file upload interface
- Product linking and management
- Real-time status monitoring
- Responsive design

## Technical Implementation

### Module Architecture

```typescript
// Digital Products
export default Module(DIGITAL_PRODUCT_MODULE, {
  service: DigitalProductModuleService,
})

// Artwork System  
export default Module(ARTWORK_MODULE, {
  service: ArtworkModuleService,
})

// Printful Integration
export default Module(PRINTFUL_MODULE, {
  service: PrintfulPodProductService,
})
```

### Database Schema

**Digital Products:**
- Secure file metadata and access control
- Download tracking and limitations
- Integration with Medusa order system

**Artwork Collections:**
- Hierarchical organization system
- Professional metadata support
- Product relationship management

**Printful Products:**
- Complete product variant mapping
- Order fulfillment tracking
- Webhook event logging

### API Endpoints

**Core APIs:**
- `/api/admin/digital-products` - Digital product CRUD
- `/api/admin/artwork-collections` - Artwork management
- `/api/admin/product-sync` - Sync operations
- `/api/admin/unified-products` - Cross-system product view

**File Management:**
- `/api/admin/uploads` - Secure file upload
- Supabase S3 integration for storage
- Automatic URL generation and serving

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- Supabase account (for file storage)
- Printful API access

### Environment Configuration

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/sen-commerce

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SUPABASE_BUCKET_NAME=sen-commerce-files

# S3 Compatible Settings (for Supabase)
S3_FILE_URL=https://your-project.supabase.co/storage/v1/object/public/
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=auto
S3_BUCKET=sen-commerce-files
S3_ENDPOINT=https://your-project.supabase.co

# Printful Integration
PRINTFUL_API_KEY=your-printful-api-key
PRINTFUL_STORE_ID=your-store-id

# Application
JWT_SECRET=your-jwt-secret
COOKIE_SECRET=your-cookie-secret
ADMIN_CORS=http://localhost:9000
STORE_CORS=http://localhost:3000
```

### Commands

```bash
# Install dependencies
npm install

# Run database migrations
npx medusa db:migrate

# Start development server
npm run dev

# Access admin panel
open http://localhost:9000/app
# Login: admin@medusajs.com / supersecret

# Build for production
npm run build && npm start
```

## Storefront Integration

### Frontend Setup

The included Next.js storefront provides:

```bash
cd sen-commerce-storefront
npm install
npm run dev
# Access at http://localhost:3000
```

**Features:**
- Product browsing by type (digital, POD, standard)
- Artwork gallery
- Shopping cart functionality
- Order management
- Responsive design ready for styling

## 🚀 Production Deployment

### Live Environment
- **Production URL:** [shop.sen.studio](https://shop.sen.studio)
- **Admin Panel:** [shop.sen.studio/app](https://shop.sen.studio/app)
- **Backend:** Railway.app deployment
- **Frontend:** Vercel deployment
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase S3-compatible storage

### Deployment Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Vercel)      │◄──►│   (Railway)     │◄──►│  (Supabase)     │
│ shop.sen.studio │    │ API & Admin     │    │  PostgreSQL     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                       ┌───────▼────────┐
                       │   File Storage │
                       │   (Supabase)   │
                       │   S3-Compatible│
                       └────────────────┘
```

## Project Status

### 🎯 **Current State: Production Live & Deployed**

### ✅ **Completed Systems**

**Backend (100% Complete & Deployed):**
- ✅ Digital product management with secure delivery
- ✅ Comprehensive artwork system with collections
- ✅ Full Printful POD integration with webhooks
- ✅ Product sync dashboard with real-time monitoring
- ✅ Complete admin interface
- ✅ API endpoints for all systems
- ✅ Database schemas and migrations
- ✅ File upload and storage system
- ✅ Production deployment on Railway

**Frontend (85% Complete & Deployed):**
- ✅ Functional storefront with product browsing
- ✅ Artwork gallery
- ✅ Shopping cart and checkout
- ✅ Order management system
- ✅ Responsive layout foundation
- ✅ Production deployment on Vercel
- 🎨 Advanced styling and UX enhancements in progress

### 🎨 **Current Phase: UI/UX Enhancement**
- Professional storefront design implementation
- Enhanced user experience flows
- Mobile optimization improvements
- Performance and SEO optimization

## Documentation

- 📖 [Printful V2 Integration](./docs/PRINTFUL_V2_INTEGRATION.md)
- 📖 [Digital Products Guide](./docs/DIGITAL_PRODUCTS.md)
- 📖 [Technical Status Report](./docs/PRINTFUL_TECHNICAL_STATUS.md)

---

## 🛠️ Tech Stack

| Component | Technology | Status |
|-----------|------------|---------|
| **Backend Framework** | Medusa.js v2 | ✅ Production |
| **Database** | PostgreSQL (Supabase) | ✅ Production |
| **Frontend** | Next.js 14 + TypeScript | ✅ Production |
| **File Storage** | Supabase S3-Compatible | ✅ Production |
| **POD Integration** | Printful API v1/v2 | ✅ Production |
| **Deployment** | Railway + Vercel | ✅ Production |
| **Authentication** | Medusa Auth | ✅ Production |
| **Payment Processing** | Stripe Integration | ✅ Production |

**Last Updated:** January 2025  
**Status:** 🚀 Live in Production - [shop.sen.studio](https://shop.sen.studio)