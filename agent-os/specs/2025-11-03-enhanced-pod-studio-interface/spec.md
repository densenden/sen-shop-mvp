# Specification: Enhanced POD Studio Interface

## Goal
Enhance existing POD Studio interfaces to provide a unified experience across Printful, Printify, and Gelato providers with bulk operations, AI-powered content generation, and template management.

## User Stories
- As a seller, I want to manage products across all POD providers in one unified interface so that I can streamline my workflow
- As a seller, I want to perform bulk operations on multiple products so that I can save time on repetitive tasks
- As a seller, I want AI to generate SEO-optimized product descriptions so that my products rank better and convert more

## Specific Requirements

**Unified Provider Dashboard**
- Enhance existing `/printful-studio` page to show products from all providers (Printful, Printify, Gelato)
- Add provider filter dropdown to filter products by source (All, Printful, Printify, Gelato)
- Display provider badge/icon on each product card for quick identification
- Implement real-time sync status indicator showing last sync time and status
- Add comparison view toggle to see pricing differences across providers for similar products
- Create unified search that works across all provider products
- Maintain existing composer workflow but extend to support all providers
- Use existing `PODProviderManager` facade to abstract provider differences

**Bulk Operations System**
- Add checkbox selection to product grid for multi-select capabilities
- Implement bulk actions toolbar that appears when products are selected
- Support bulk price updates with percentage or fixed amount adjustments
- Enable bulk status changes (draft/published/archived)
- Add bulk description/SEO metadata updates using AI generation
- Implement bulk variant enable/disable across selected products
- Create bulk delete with confirmation dialog
- Add progress indicator for bulk operations with cancel capability

**AI Content Generation Integration**
- Add OpenAI API integration service at `/src/modules/ai/services/openai-service.ts`
- Implement GPT-4 model configuration for ecommerce-optimized content
- Create content generation endpoint at `/api/admin/ai/generate-content`
- Generate 3 variations of product descriptions per request
- Pull context from artwork metadata, collections, and POD provider descriptions
- Include SEO keywords extraction and optimization
- Auto-generate meta titles and descriptions following ecommerce best practices
- Cache generated content for 24 hours to reduce API calls

**Template Management System**
- Create template model extending Medusa's base entity
- Store templates with name, description, provider, variant configs, pricing rules
- Add template CRUD endpoints at `/api/admin/pod-templates`
- Implement template picker UI component for product creation
- Support template application during bulk product creation
- Include pricing formula support (cost + markup percentage)
- Allow template sharing across providers where applicable
- Add template versioning for tracking changes

**Undo/Redo Functionality**
- Implement action history manager storing last 20 operations
- Create undo stack with operation type, affected items, previous state
- Add undo/redo buttons in the UI toolbar
- Support undo for bulk operations with single action
- Clear history on page navigation or after 30 minutes
- Show toast notification when action is undone/redone
- Persist undo state in session storage for page refreshes

**Provider Facade Enhancement**
- Extend existing `PODProviderManager` to support Printify and Gelato
- Create `PrintifyProvider` class implementing `PODProvider` interface
- Create `GelatoProvider` class implementing `PODProvider` interface
- Map provider-specific features to common interface methods
- Handle provider API rate limits with exponential backoff
- Implement provider health check endpoint
- Add provider capability matrix for feature availability
- Use dependency injection for provider services

**UI/UX Improvements**
- Enhance existing product grid with lazy loading and virtualization
- Add dark mode support matching existing theme system
- Implement keyboard shortcuts for common actions (Ctrl+Z for undo)
- Add tooltips explaining provider-specific features
- Create loading skeletons for better perceived performance
- Add error boundaries with helpful error messages
- Implement optimistic UI updates for better responsiveness

**Performance Optimizations**
- Implement pagination with 50 products per page default
- Add infinite scroll option as alternative to pagination
- Cache provider API responses for 5 minutes
- Use TanStack Query for efficient data fetching and caching
- Implement request batching for bulk operations
- Add database indexes for common query patterns
- Use web workers for heavy computations

## Visual Design

No visual mockups were provided for this specification.

## Existing Code to Leverage

**POD Provider Facade (`/src/modules/printful/services/pod-provider-facade.ts`)**
- Already implements facade pattern with `PODProvider` interface and `PODProviderManager`
- Has `PrintfulProvider` implementation that can be used as template for Printify and Gelato
- Provides standardized methods for product CRUD, order management, and fulfillment
- Use existing interface definitions (PODProduct, PODVariant, PODOrder) for consistency
- Extend `PODProviderManager` to register new Printify and Gelato providers

**Printful Studio Interface (`/src/admin/routes/printful-studio/page.tsx`)**
- Already has composer workflow, artwork selection, and product creation flow
- Implements tabbed interface with dashboard, artworks, catalog, composer sections
- Has existing state management for composer session and workflow steps
- Reuse UI components and layout structure for unified interface
- Extend existing hooks and API calls to work with facade pattern

**PrintifyService (`/src/modules/printify/services/printify-service.ts`)**
- Already has basic Printify API integration with authentication
- Implements blueprint catalog, product, and order methods
- Has error handling and request helper methods
- Wrap this service in a `PrintifyProvider` implementing the `PODProvider` interface
- Reuse API methods for the facade implementation

**Medusa Admin UI Components**
- Use existing Table, Badge, Button, Input, Select components from `@medusajs/ui`
- Leverage existing admin route structure and authentication
- Reuse existing product and variant models from Medusa
- Utilize existing webhook handling infrastructure
- Build on existing file upload and storage patterns

**Database Models and Services**
- Reuse existing artwork model and service for artwork management
- Leverage existing product-artwork linking functionality
- Use existing webhook and sync tracking patterns
- Build on current product metadata storage approach
- Extend existing admin API route patterns

## Out of Scope
- Creating entirely new interfaces or pages (must enhance existing ones)
- Building new POD provider integrations beyond Printful, Printify, and Gelato
- Implementing persistent version history or audit logs (only session-based undo)
- Advanced AI features beyond product description and SEO content generation
- Payment processing or checkout flow modifications
- Customer-facing storefront changes except for template display
- Mobile app development or responsive mobile admin interface
- Real-time collaborative editing features
- Custom print file generation or design tools
- Inventory management or warehouse integration