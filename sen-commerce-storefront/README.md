# Sen-Commerce Storefront

## Overview

Modern Next.js storefront for Sen-Commerce e-commerce platform. Features product browsing, artwork gallery, and shopping cart functionality with clean, responsive design ready for styling.

## Features

### ✅ **Functional Components**
- **Product Browsing** - Filter by digital, print-on-demand, and standard products
- **Artwork Gallery** - Visual artwork browser with high-quality display
- **Shopping Cart** - Add, remove, and manage cart items
- **Responsive Layout** - Mobile-first design foundation
- **API Integration** - Full backend connectivity

### 🎨 **Ready for Styling**
- Clean component structure
- Tailwind CSS foundation
- Professional grid layouts
- Consistent spacing system
- Typography framework

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks
- **API:** RESTful integration with Sen-Commerce backend

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Access storefront
open http://localhost:3000
```

## Development

### Environment Setup

The storefront automatically proxies API calls to the backend:
- Backend: `http://localhost:9000`
- Storefront: `http://localhost:3000`
- API Proxy: `/api/*` → `http://localhost:9000/api/*`

### Project Structure

```
app/
├── page.tsx           # Product listing page
├── artworks/
│   └── page.tsx       # Artwork gallery
├── cart/
│   └── page.tsx       # Shopping cart
├── layout.tsx         # Root layout with navigation
└── globals.css        # Global styles
```

### Component Architecture

#### **Product Page (`/`)**
- Product grid with type filtering
- Product cards with metadata
- Add to cart functionality
- Responsive design

#### **Artwork Gallery (`/artworks`)**
- **Collections Display**: Organized artwork collections with metadata
- **Collection Info**: Topic, purpose, creation date, Midjourney version
- **Interactive Gallery**: Click artworks to view full-size with navigation
- **Product Integration**: Shows products using each artwork
- **Lightbox Modal**: Full-screen artwork viewing with prev/next navigation
- **Professional Layout**: Collection headers, thumbnails, and grid displays

#### **Shopping Cart (`/cart`)**
- Cart item management
- Quantity controls
- Price calculations
- Order summary
- Checkout preparation

## API Integration

### Endpoints Used
- `GET /api/admin/unified-products` - Product listing
- `GET /api/admin/artwork-collections` - Artwork data

### Data Flow
```typescript
// Product interface
interface Product {
  id: string
  title: string
  description?: string
  product_type: "digital" | "printful_pod" | "standard"
  file_size?: number
  mime_type?: string
  printful_id?: string
  created_at: string
  updated_at: string
}
```

## Styling Framework

### Current State
- **Base Styling:** Tailwind CSS utility classes
- **Layout:** Responsive grid system
- **Components:** Functional but basic styling
- **Typography:** System font stack

### Ready for Enhancement
- Color palette implementation
- Component design system
- Animation and transitions
- Brand identity integration

## Customization Guide

### Adding New Pages
```typescript
// app/new-page/page.tsx
export default function NewPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">New Page</h1>
      {/* Content */}
    </div>
  )
}
```

### Styling Components
```typescript
// Consistent styling patterns
const cardStyles = "bg-white rounded-lg shadow hover:shadow-md transition-shadow"
const buttonStyles = "bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
const gridStyles = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
```

### Adding API Endpoints
```typescript
// Fetch data pattern
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch('/api/endpoint')
      const data = await response.json()
      setData(data.items || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }
  fetchData()
}, [])
```

## Performance Features

### ✅ **Built-in Optimizations**
- Next.js automatic code splitting
- Image optimization ready
- Static asset optimization
- Efficient re-renders with proper key usage

### ✅ **Loading States**
- Skeleton loading animations
- Graceful error handling
- Optimistic UI updates
- Proper loading indicators

## Deployment

### Build Configuration
```bash
# Build for production
npm run build

# Start production server
npm start

# Static export (if needed)
npm run build && npm run export
```

### Environment Variables
```bash
# Next.js automatically proxies to backend
# No additional environment variables needed for development
```

### Deployment Platforms
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Custom server**

## Development Roadmap

### 🎨 **Phase 1: Design System (1-2 weeks)**
- Professional color palette
- Typography system
- Component library
- Brand identity integration

### 🎯 **Phase 2: UX Enhancement (2-3 weeks)**
- Improved navigation
- Loading animations
- Error handling
- User feedback systems

### 📱 **Phase 3: Mobile Optimization (1 week)**
- Touch interactions
- Performance optimization
- Progressive Web App features
- Offline functionality

### 🚀 **Phase 4: Advanced Features (2-3 weeks)**
- User authentication
- Order tracking
- Wishlist functionality
- Search and filtering

## Contributing

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Component-based architecture

### Testing Strategy
- Unit tests for components
- Integration tests for API calls
- E2E testing for user flows
- Performance monitoring

---

## Status: Ready for Styling

The storefront is **functionally complete** and ready for professional design implementation. All core features work, API integration is solid, and the architecture supports rapid styling development.

**Next Step:** Implement design system and enhance user experience.

---

Built with ❤️ using Next.js 14 and TypeScript