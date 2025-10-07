# Printful Studio Redesign Blueprint

## 1. Objectives
- Offer a production-ready Printful Studio inside Medusa that imports store products with full media payloads and pricing.
- Keep v1 (store/sync) and v2 (catalog beta) experiences side-by-side without state leakage.
- Make linking between artworks ⇄ Printful templates ⇄ Medusa POD products first-class and batch-friendly.
- Provide visibility on import status, fulfillment readiness, and asset coverage directly in the catalog grid.

## 2. UX Summary
- **Version Switch**: persistent toggle (v1 stable, v2 beta) that scopes all sub-tabs and API calls.
- **Tabs**: Dashboard, Catalog, Artworks, Composer, Mockups, Importer, Orders, Settings. (Guide removed.)
- **Catalog Enhancements**:
  - Product tiles show: primary mockup, total assets, artwork associations, Medusa sync state, availability badge.
  - Drawer view (`GET /printful-studio/:version/catalog/:id`) reveals variants, placements, files, pricing, mockup previews.
  - Inline actions: `View mockups`, `Link artwork`, `Batch add to importer queue`.
- **Artworks**: actionable grid (link/unlink to Printful products, quick launch composer, batch assign placement profiles).
- **Importer**: queue-based, shows selected Printful templates with asset coverage, allows multi-import with progress feedback.
- **Orders**: surfaces Printful order statuses + Medusa order mapping, supports batch operations (confirm/cancel/refresh).

## 3. Backend Architecture
- **Service Interfaces** (`src/modules/printful/services/studio/…`)
  - `PrintfulStudioBaseService`
    - Resolves: `printfulModule` (for Printful API facade), `Modules.PRODUCT` (Medusa products), `artworkModuleService`.
    - Helper `getMedusaIndex()` returns map `{ printful_product_id -> { id, status, title, thumbnail, metadata } }`.
    - New abstract `getProductDetail(productId)` implemented per version.
    - `listCatalog()` now yields `PrintfulStudioCatalogProduct` with:
      - `import_state`: `not_imported | imported | imported_draft | imported_disabled`
      - `medusa_product_id`, `medusa_product_status`, `medusa_handle`.
      - `available_to_order`: true iff imported + Medusa status `published`.
      - `asset_counts`: `{ thumbnail, mockups, variant_files, total }` derived from Printful data or Medusa metadata.
      - `linked_artworks` (existing) plus `primary_artwork_id` for quick badges.
  - `PrintfulStudioServiceV1`
    - Uses `fetchStoreProducts()` for listing, `getStoreProduct()` for detail, `fetchSyncProducts()` for template metadata.
    - Normalizes Printful payload differences (sync vs store) and caches detail lookups.
  - `PrintfulStudioServiceV2`
    - Uses `fetchCatalogProducts()` for listing, `getCatalogProduct()` + `getMockupTemplates()` for detail assets.
- **New Route** `src/api/admin/printful-studio/[version]/catalog/[productId]/route.ts`
  - Returns `{ product, detail, assets, medusa, artworks }` bundle.
- **Importer Flow** (`src/api/admin/printful-studio/[version]/importer/route.ts`)
  - Accepts `product_ids`, optional `artwork_id`, optional `pricing_rules`.
  - Invokes shared importer util (`importProducts`) with enriched context (API version, asset preload flag).
  - Streams progress logs for UI polling (future enhancement via SSE).
- **Batch Linking** `POST /printful-studio/:version/artworks/link`
  - Body: `{ artwork_id, product_ids[], primary?: boolean }` stores records in artwork relations table.
- **Media Collector**
  - Utility `collectPrintfulPreviewSet(printfulProduct)` generates mockups/variant file URLs without uploading (used for UI).
  - Reuses heavy `ProductImageService` only when importing (uploads to Medusa file service).

## 4. Printful API Coverage
- **v1**: `/store/products`, `/store/products/:id`, `/sync/products`, `/files/:id`.
- **v2 beta**: `/v2/catalog-products`, `/v2/catalog-products/:id`, `/v2/mockup-tasks`, `/v2/mockup-templates`, `/v2/orders`, `/v2/webhooks`.
- Rate-limit guards and response caching (15s) at `PrintfulPodProductService` level.

## 5. Batch Capabilities
- Catalog multi-select -> add to importer queue.
- Artworks multi-select -> link to many Printful products (per version) and launch composer sessions.
- Importer queue -> concurrent import with max parallelism (configurable, default 3) and failure retries.
- Orders tab -> batch confirm/cancel/draft release via Printful orders API.

## 6. Data Contracts
- `PrintfulStudioCatalogProduct` (extended interface)
- `PrintfulStudioCatalogDetail` (new) includes `{ placements, variants, files, assets }`.
- `PrintfulStudioAssetSummary` describes counts + first few URLs for previews.
- `PrintfulStudioImportResult` standardizes importer responses (success, skipped, errors with reasons).

## 7. Implementation Phases
1. Extend backend services & routes (catalog summary/detail, importer metadata, artwork linking).
2. Refactor admin route into composable components (version switch, tab layout, catalog grid + drawer, actionable artworks).
3. Wire importer queue with async polling + toast feedback.
4. Add batch API endpoints for artworks + orders.
5. Harden error handling, rate-limit warnings, telemetry.
6. Optional: dual-pane compare mode & diff export for v1 vs v2 (post-MVP).

## 8. Testing Strategy
- Unit tests for new service helpers (medusa index, asset summarizer).
- Integration tests for `GET /catalog` and `GET /catalog/:id` verifying import status + asset counts.
- End-to-end admin route smoke tests (Playwright) for catalog listing, detail drawer, importer queue.

