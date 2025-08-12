# SenCommerce MVP

**Digital Art & Print-on-Demand E-commerce Platform**

> A modern full-stack e-commerce solution built with Medusa.js v2, React, and TypeScript. Specializing in digital artwork sales and print-on-demand fulfillment with automated business workflows.

**🎯 Project Status:** Production-ready backend, functional storefront  
**⏱️ Development Timeline:** 3 months (May-Aug 2025)  
**👨‍💻 Developer:** Denis Kreuzer - Full-Stack Developer (Learning)  
**🎓 Program:** WebDev Track Student Project  
**👨‍🏫 Mentor:** Anastasios Kyr  

---

## 🚀 Platform Overview

SenCommerce is a comprehensive e-commerce platform that bridges the gap between digital art creation and multiple revenue streams. Built with a modular architecture, it supports both digital product sales and print-on-demand fulfillment through a single, unified system.

### Why This Project?

As an artist and developer, I needed a platform that could handle both digital art sales and print-on-demand without the limitations of existing solutions:

**Current Platform Limitations:**
- **Etsy**: Limited customization, high fees, no brand control
- **Shopify**: Monthly costs, app dependency, vendor lock-in  
- **Custom Solutions**: High development cost, long time to market

**My Solution:** A flexible, cost-effective platform with complete control over features and branding.

---

## 👨‍🎨 About the Developer

### Professional Background
**Creative Director & Entrepreneur** with extensive experience in:
- Branding, campaign & event conception
- Corporate design and visual communication  
- Leading client projects in design and technical implementation
- Building consistent visual identities and design systems

### Technical Journey  
**From Design to Full-Stack Development:**
- **Learning Programming**: JavaScript, React, Tailwind, TypeScript, Python
- **Modern Tech Stack**: Bridging design and development
- **Problem-Solving**: Combining creative thinking with technical implementation
- **Automation Processes**: Building efficient workflows and automated systems

### Studio Sen
**Connecting Design, Code & Mindfulness:**
- **Individual Meditations**: Custom audio for individuals & companies
- **YouTube Content**: Guided meditation channel reaching thousands
- **Digital Files**: MidJourney-generated designs as high-resolution print files (B2B focus: brands, designers, creatives)

---

## 🏗️ System Architecture

### Frontend Applications
- **React Storefront (FE1)**: Customer-facing e-commerce site with server-side rendering
- **Vite Admin Dashboard (FE2)**: Fast content management interface

### Backend Core  
- **Medusa.js v2 Framework**: Modular e-commerce engine
- **Custom Modules**: Artwork, Digital Products, Printful integration
- **REST API**: 25+ endpoints with proper authentication
- **Built with Vite**: Fast development and production builds

### External Services
- **Printful API (POD)**: Automated product fulfillment  
- **Stripe**: Secure payment processing
- **Supabase**: S3-compatible storage with PostgreSQL
- **Resend**: Automated email notifications
- **Railway/Vercel**: Cloud hosting and CI/CD

---

## 🎯 Core Features

### 🎨 Digital Art Management
- **Artwork Collections**: Organized digital art with metadata
- **Product Relationships**: Many-to-many artwork-product connections
- **Image Processing**: High-resolution file handling with optimization
- **Collection Organization**: Themed groupings for better browsing

### 🖨️ Print-on-Demand Integration
- **Printful V2 API**: Complete product catalog sync
- **Automated Fulfillment**: Order forwarding with real-time updates
- **Mockup Generation**: Dynamic product previews
- **Webhook Processing**: Status synchronization and tracking

### 💾 Digital Product Delivery
- **Secure Downloads**: Token-based access with expiry (7 days)
- **File Management**: 50MB upload limit with validation
- **Download Tracking**: Usage monitoring and limits
- **Multiple Formats**: Support for various file types

### 🛒 E-commerce Core
- **Product Catalog**: Advanced filtering and search
- **Shopping Cart**: Real-time updates and persistence
- **Checkout Flow**: Stripe integration with order tracking
- **Customer Management**: Account creation and order history

### 📧 Communication System
- **Resend Integration**: Automated order confirmations
- **Email Templates**: Branded customer communications
- **Download Notifications**: Secure link delivery
- **Tracking Updates**: Real-time order status notifications

---

## 🔧 Technology Stack

### Backend Technologies
- **Medusa.js v2.8.4**: Modular e-commerce engine
- **Vite**: Fast development and production builds
- **PostgreSQL**: Reliable relational database
- **Medusa Framework ORM**: Built-in type-safe ORM
- **TypeScript**: Type safety and better developer experience

### Frontend Technologies  
- **React 18**: Component-based user interfaces
- **Tailwind CSS**: Utility-first responsive design
- **Vite Admin**: Fast admin interface with Medusa
- **React Components**: Medusa admin components

### Infrastructure
- **Supabase**: File storage & database hosting
- **Stripe**: Payment processing integration
- **Printful V2**: Print-on-demand fulfillment
- **Resend**: Email delivery service
- **Railway/Vercel**: Deployment and hosting

---

## 🗄️ Database Architecture

**15+ Tables with Optimized Relationships**

### Core Medusa Tables
- `product`, `product_variant`, `customer`, `cart`, `order`, `payment`, `fulfillment`

### Custom Module Tables
- `artwork`, `artwork_collection`, `digital_product`, `digital_product_download`
- `printful_product`, `printful_order_tracking`, `printful_sync_log`

### Key Relationships
- **ArtworkCollection (1) → (many) Artwork**
- **Artwork (many) → (many) Product** 
- **DigitalProduct (1) → (many) DigitalProductDownload**
- **Order (1) → (many) OrderItem → (1) Product**

### Database Optimizations
- Proper indexing on frequently queried fields
- Efficient foreign key relationships
- Automated timestamp tracking
- Data integrity constraints

---

## 🔌 API Architecture

**25+ RESTful Endpoints with Proper Authentication**

### Admin Endpoints (`/api/admin/`)
**Session-based authentication**
- **Artworks**: CRUD operations, image upload
- **Collections**: Organization and management
- **Digital Products**: File upload, download management
- **Product Sync**: Printful integration status
- **Uploads**: File handling service

### Store Endpoints (`/api/store/`)
**JWT tokens for customers**
- **Products**: Public catalog with filtering
- **Artworks**: Browse collections and details
- **Cart**: Shopping cart management
- **Auth**: Customer authentication
- **Downloads**: Secure token-based access

### Security Features
- CORS configuration for frontend domains
- File type and size validation (50MB limit)
- Token-based secure downloads with expiry
- JWT authentication for customer sessions
- SQL injection protection via Medusa ORM

---

## 🧩 Custom Modules Deep Dive

### Artwork Module
**Digital artwork and collection management**
- Hierarchical organization with metadata tracking
- Collection management with public/private settings
- Product relationships for multi-channel sales
- MidJourney version tracking for AI-generated content

### Digital Product Module  
**Secure downloadable product delivery**
- File upload with 50MB limit and validation
- Token-based downloads with expiry management
- Download tracking and usage limits
- Integration with order fulfillment workflows

### Printful Module
**Print-on-demand integration and automation**
- Printful V2 API integration with product sync
- Automated order forwarding and tracking
- Webhook processing for real-time updates
- Multi-file support for complex products

---

## 🎮 Live Demo

### Demo Access
- **Storefront**: `http://localhost:3000` - Customer-facing e-commerce site
- **Admin Panel**: `http://localhost:9000/app` - Management dashboard

### Key Demo Scenarios
1. **Create POD Product** - Set up print-on-demand product with Printful integration
2. **Create Artwork Collection** - Organize digital artworks into themed collections  
3. **Add Artworks** - Upload and manage individual artwork pieces
4. **Browse Artwork Collections** - Explore organized digital art collections
5. **Complete Checkout Flow** - End-to-end purchase experience

### Demo Features
- Responsive design across devices
- Real-time cart updates  
- Secure payment processing
- Automated email notifications
- Admin dashboard functionality

---

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Redis (for sessions)

### Backend Setup
```bash
cd sen-commerce
npm install
npm run dev
```

### Storefront Setup  
```bash
cd sen-commerce-storefront
npm install
npm run dev
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sencommerce

# Medusa Configuration
MEDUSA_ADMIN_ONBOARDING_TYPE=default
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:9000

# External Services
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
STRIPE_PUBLISHABLE_KEY=pk_test_...
PRINTFUL_API_KEY=your-printful-key
RESEND_API_KEY=re_...
```

---

## 📊 Technical Achievements

### Skills Developed
- **Medusa.js Mastery**: Custom module development and service integration
- **TypeScript Advanced**: Enterprise-level typing and error handling  
- **Database Design**: Complex relationships and performance optimization
- **API Integration**: Multiple third-party service connectivity
- **Full-Stack Development**: End-to-end feature delivery

### Complex Problems Solved
- **Medusa Service Method Naming**: Discovered auto-pluralization in MedusaService base class
- **File Upload in Admin Interface**: Built custom upload endpoint with Multer + Supabase integration
- **Secure Digital Product Downloads**: Implemented token-based system with expiry and download limits
- **Real-time Order Tracking**: Webhook integration with comprehensive status synchronization

---

## 🚀 Roadmap

### Phase 1: UX Improvements (Next 4 weeks)
- Professional design system implementation
- Mobile-responsive optimizations
- Loading states and animations
- Enhanced error handling

### Phase 2: Advanced Features (2-3 months)
- Multi-language support
- Advanced search and filtering
- Customer reviews and ratings  
- Social media integration
- Analytics dashboard

### Phase 3: Business Scaling (3-6 months)
- Multi-vendor marketplace
- Subscription products
- Loyalty program
- Advanced inventory management
- AI-powered recommendations

---

## 📁 Project Structure

```
├── sen-commerce/                 # Medusa.js Backend
│   ├── src/
│   │   ├── modules/             # Custom Modules
│   │   │   ├── artwork-module/
│   │   │   ├── digital-product/
│   │   │   └── printful-module/
│   │   ├── api/                 # REST Endpoints
│   │   │   ├── admin/          # Admin APIs
│   │   │   ├── store/          # Store APIs
│   │   │   └── webhooks/       # External Webhooks
│   │   └── admin/              # Admin UI Extensions
│   └── migrations/             # Database Migrations
│
├── sen-commerce-storefront/     # Next.js Frontend
│   ├── app/                    # App Router Pages
│   ├── components/             # React Components  
│   ├── lib/                    # Utilities
│   └── public/                 # Static Assets
│
└── sen-commerce-presentation/   # Project Presentation
    ├── components/             # Slide Components
    ├── data/                   # Presentation Content
    └── public/images/          # Demo Screenshots
```

---

## 🔍 Key Learning Points

### Medusa.js Module System
- Modular architecture with custom business logic encapsulation
- Service auto-generation with pluralized method names
- Module registration with `isQueryable: true` for admin access
- TypeScript integration with proper type definitions

### Database Migration Challenge
**Railway to Supabase Migration:**
- Generated complete SQL dump from Railway PostgreSQL
- Preserved all table structures, relationships, and data  
- Configured Supabase PostgreSQL connection
- Restored complete database schema with zero data loss
- Updated environment variables and connection strings

### API Security Implementation
- Multi-layer authentication (session, bearer, JWT)
- Token-based secure downloads with cryptographic security
- CORS configuration for cross-origin requests
- File upload validation and size restrictions

---

## 📈 Business Impact

### Revenue Streams
- **Digital Product Sales**: Immediate delivery, high margins
- **Print-on-Demand**: Automated fulfillment, scalable inventory
- **B2B Services**: Design files for brands and creatives

### Operational Efficiency
- **Automated Workflows**: Reduced manual intervention
- **Real-time Synchronization**: Inventory and order management
- **Scalable Architecture**: Handle growth without major refactoring

---

## 🤝 Contributing

This is a student project showcasing full-stack development skills. For questions or collaboration opportunities, please reach out through GitHub.

---

## 📝 License

MIT License - See LICENSE file for details

---

## 📞 Contact

**Denis Kreuzer**  
Full-Stack Developer (Learning)  
[GitHub Repository](https://github.com/densenden/sen-commerce-mvp)

---

*Built with ❤️ using Medusa.js v2, React, and TypeScript*  
*Last Updated: August 2025*