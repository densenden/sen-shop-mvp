# Tech Stack

## Backend Infrastructure

### Core Framework
- **E-commerce Platform:** Medusa.js v2.8.4 (headless commerce engine)
- **Runtime:** Node.js 20+
- **Language:** TypeScript with strict mode
- **Build Tool:** Vite for development and production builds
- **Package Manager:** npm

### Database & Storage
- **Primary Database:** PostgreSQL 13+
- **Database Hosting:** Supabase (PostgreSQL as a service)
- **ORM:** Medusa Framework ORM (built-in)
- **File Storage:** Supabase Storage (S3-compatible)
- **Session Store:** Redis

### API & Services
- **API Type:** RESTful with JWT authentication
- **API Documentation:** OpenAPI/Swagger specification
- **Webhook Processing:** Express middleware for POD services
- **Background Jobs:** Medusa workflows and subscribers

## Frontend Architecture

### Storefront (Customer-facing)
- **Framework:** Next.js 14 with App Router
- **UI Library:** React 18
- **Styling:** Tailwind CSS 3.3
- **State Management:** React Context + TanStack Query
- **Internationalization:** next-intl (static) + GT React (dynamic)
- **Icons:** Lucide React

### Admin Dashboard
- **Framework:** Vite with React
- **UI Components:** Medusa Admin SDK components
- **Styling:** Medusa design system
- **State Management:** Medusa Admin SDK hooks

## Third-Party Integrations

### Print-on-Demand Services
- **Printful:** V2 API with webhook support
- **Printify:** REST API with pagination
- **Gelato:** Template-based workflow (planned)

### Payment & Commerce
- **Payment Processing:** Stripe (via Medusa payment module)
- **Checkout:** Stripe Elements with React integration

### Communication
- **Email Service:** Resend API
- **Email Templates:** React Email with Tailwind
- **Transactional Emails:** Order confirmations, download links

### Authentication
- **Customer Auth:** JWT tokens with Medusa auth module
- **Admin Auth:** Session-based with Medusa admin

## Development Tools

### Code Quality
- **Type Checking:** TypeScript strict mode
- **Linting:** ESLint with Next.js config
- **Testing:** Jest with Medusa test utils
- **API Testing:** Integration tests with test database

### Build & Deploy
- **Backend Hosting:** Railway (production)
- **Frontend Hosting:** Vercel (Next.js optimized)
- **CI/CD:** GitHub Actions (planned)
- **Environment Management:** .env files with validation

## Design System

### Typography
- **Primary Font:** System font stack (optimized loading)
- **Monospace:** Default system monospace

### Component Libraries
- **UI Components:** Custom components with Tailwind
- **Form Handling:** React Hook Form (planned)
- **Data Tables:** Custom implementation with sorting/filtering

### Theming
- **Color System:** CSS variables for light/dark modes
- **Responsive Design:** Mobile-first with Tailwind breakpoints
- **Animations:** CSS transitions with Tailwind utilities

## Security & Performance

### Security Measures
- **CORS Configuration:** Whitelisted domains
- **File Upload Validation:** Type and size restrictions (50MB)
- **SQL Injection Protection:** ORM parameterized queries
- **Token Security:** Cryptographic token generation

### Performance Optimization
- **Image Optimization:** Sharp for processing
- **Caching Strategy:** Browser caching + CDN
- **Database Indexing:** Optimized queries
- **Code Splitting:** Next.js automatic splitting

## Monitoring & Analytics

### Application Monitoring
- **Error Tracking:** Console logging (Sentry planned)
- **Performance Monitoring:** Vercel Analytics (frontend)
- **API Monitoring:** Custom logging middleware

### Business Analytics
- **Google Analytics:** Customer behavior tracking (planned)
- **Custom Analytics:** Sales and product performance dashboards