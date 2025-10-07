# Printful Mockup Generation Service

## Overview

The Printful Mockup Service handles the generation of product mockup images using Printful's V2 API. This service creates realistic product visualizations by applying custom artwork to product variants.

## Architecture

### Core Service Files

1. **[printful-pod-product-service.ts](../src/modules/printful/services/printful-pod-product-service.ts)**
   - Main service handling all Printful API interactions
   - Methods: `generateMockups()`, `getMockupStatus()`, `generateAndWaitForMockups()`

2. **[base-service.ts](../src/modules/printful/services/studio/base-service.ts)**
   - Studio-level mockup generation wrapper
   - Handles artwork resolution and wait time configuration

3. **[mockups/route.ts](../src/api/admin/printful-studio/[version]/catalog/[productId]/mockups/route.ts)**
   - HTTP endpoint for mockup generation requests
   - Handles upload to Medusa storage

## Mockup Generation Flow

### 1. Request Structure

```typescript
POST /admin/printful-studio/v2/catalog/{productId}/mockups

Body:
{
  artwork_url: string,
  artwork_id?: string,
  variant_ids: string[],
  wait_for_completion?: boolean,
  upload_to_medusa?: boolean
}
```

### 2. API Request to Printful

The service creates **separate mockup tasks per variant** to allow different mockup styles:

```typescript
// Create one product entry per variant
const products = variantIds.map(variantId => ({
  source: 'catalog',
  catalog_product_id: parseInt(productId, 10),
  catalog_variant_ids: [parseInt(variantId, 10)],
  placements: [{
    placement: 'default',  // or 'mockup', depending on product
    technique: 'digital',  // or 'sublimation', 'dtg', etc.
    layers: [{
      type: 'file',
      url: artworkUrl
    }]
  }]
}))

// Send to Printful V2 API
POST https://api.printful.com/v2/mockup-tasks
{
  format: 'jpg',
  products: products
}
```

### 3. Response Structure

Printful returns an array of task objects:

```json
{
  "data": [
    {
      "id": 830585949,
      "status": "pending",
      "catalog_variant_mockups": [],
      "failure_reasons": []
    },
    ...
  ]
}
```

### 4. Polling for Completion

The service polls each task until completion:

```typescript
GET https://api.printful.com/v2/mockup-tasks?id={taskId}

// Completed response:
{
  "data": [{
    "id": 830585949,
    "status": "completed",
    "catalog_variant_mockups": [
      {
        "catalog_variant_id": 1320,
        "mockups": [
          {
            "placement": "default",
            "technique": "sublimation",
            "style_id": 10421,
            "mockup_url": "https://printful-upload.s3-accelerate.amazonaws.com/...",
            "view": "Handle on Right"
          }
        ]
      }
    ]
  }]
}
```

### 5. URL Extraction

The service flattens the nested structure to extract mockup URLs:

```typescript
// catalog_variant_mockups[] → each has mockups[] → each has mockup_url
const flattenedMockups = mockups.flatMap(variantMockup => {
  const innerMockups = variantMockup.mockups || []
  return innerMockups.map(m => ({
    mockup_url: m.mockup_url,
    variant_id: variantMockup.catalog_variant_id,
    placement: m.placement,
    technique: m.technique,
    style_id: m.style_id,
    view: m.view
  }))
})
```

## Key Concepts

### Placements

Placements define where the artwork is applied on the product. Common values:
- `default` - Primary print area
- `mockup` - Mockup-specific placement
- Product-specific placements vary by catalog item

**Important**: Each product has specific allowed placements. Using an incorrect placement (e.g., `front` instead of `default`) will result in a 400 error.

### Techniques

Print techniques vary by product:
- `digital` - Digital printing
- `sublimation` - Dye sublimation
- `dtg` - Direct-to-garment
- `embroidery` - Embroidered designs

### Mockup Styles

Each product/variant combination has specific compatible mockup styles. The service:
1. Fetches available styles via `/catalog-products/{id}/mockup-styles`
2. Does NOT specify style IDs (lets Printful auto-select)
3. Printful automatically chooses compatible styles per variant

**Why we don't specify style IDs**: Different variants require different mockup styles due to variant restrictions. Letting Printful auto-select ensures compatibility.

## Common Issues & Solutions

### Issue 1: `mockup_style_ids` Returning NaN

**Problem**: Mockup style IDs were parsed incorrectly from API response.

**Solution**: The mockup styles API returns placement objects with nested `mockup_styles` arrays:

```typescript
// Correct structure:
{
  placement: 'default',
  mockup_styles: [
    { id: 9972, ... },
    { id: 9992, ... }
  ]
}
```

We now omit `mockup_style_ids` entirely and let Printful auto-select.

### Issue 2: Style ID Conflicts Across Variants

**Problem**: Style ID 21647 works for variant A but not variants B/C.

**Solution**: Create separate product entries per variant in the mockup request, allowing Printful to select different styles for each variant.

### Issue 3: Task ID is Undefined

**Problem**: Response parsing expected single task but received array.

**Solution**: Updated to handle array responses:

```typescript
const tasks = data.data || data
const tasksArray = Array.isArray(tasks) ? tasks : [tasks]
return {
  task_ids: tasksArray.map(t => t.id)
}
```

### Issue 4: Mockup URLs are Undefined

**Problem**: Incorrect extraction from `catalog_variant_mockups` structure.

**Solution**: Properly flatten nested structure (see "URL Extraction" above).

### Issue 5: Wrong File Type Error

**Problem**: `Incorrect file type: front. Allowed file types: default, mockup`

**Solution**: Use placement from session design settings instead of hardcoded 'front':

```typescript
const placement = session.design?.placement || 'default'
files: [{
  id: printfulFileId,
  type: placement  // Not 'front'
}]
```

### Issue 6: Only 3 Mockups Generated

**Problem**: UI limited preview to first 3 variants.

**Solution**: Removed `.slice(0, 3)` limitation to generate mockups for all selected variants.

### Issue 7: Timeout After 5 Seconds

**Problem**: Mockup generation takes longer than 5-second timeout.

**Solution**: Changed `wait_for_completion: false` to `true`, increasing timeout from 5s to 90s.

## Configuration

### Timeout Settings

```typescript
// In base-service.ts
const maxWaitTime = waitForCompletion ? 90000 : 5000

// For product creation (always wait):
wait_for_completion: true  // 90 seconds

// For quick previews:
wait_for_completion: false  // 5 seconds
```

### Polling Configuration

```typescript
const pollInterval = 3000  // Poll every 3 seconds
const maxWaitTime = 90000  // Give up after 90 seconds
```

## API Endpoints

### Generate Mockups

```
POST /admin/printful-studio/v2/catalog/{productId}/mockups
```

**Request Body:**
```json
{
  "artwork_url": "https://...",
  "artwork_id": "01K6WF...",
  "variant_ids": ["1320", "4830", "16586"],
  "wait_for_completion": true,
  "upload_to_medusa": true
}
```

**Response:**
```json
{
  "success": true,
  "product_id": "19",
  "variant_ids": ["1320", "4830", "16586"],
  "mockup_urls": [
    "https://printful-upload.s3-accelerate.amazonaws.com/...",
    "https://printful-upload.s3-accelerate.amazonaws.com/...",
    "https://printful-upload.s3-accelerate.amazonaws.com/..."
  ],
  "medusa_urls": [
    "https://your-medusa-backend.com/uploads/...",
    "https://your-medusa-backend.com/uploads/...",
    "https://your-medusa-backend.com/uploads/..."
  ]
}
```

## Usage in Product Creation

The mockup service is integrated into the product creation flow:

```typescript
// 1. Generate mockups during product creation
const mockupUrls = await printfulService.generateAndWaitForMockups(
  catalogProductId,
  selectedVariantIds,
  artworkUrl,
  90000,  // 90 second timeout
  placement,
  technique
)

// 2. Upload mockups to Medusa
const imageService = new ProductImageService(req)
for (const url of mockupUrls) {
  const uploadedUrl = await imageService.downloadAndUploadImage(url)
  images.push(uploadedUrl)
}

// 3. Create Medusa product with mockup images
const product = await productModule.createProducts({
  title: productTitle,
  images: images.map(url => ({ url }))
})
```

## Testing

### Manual Testing

1. Navigate to http://localhost:9000/app/printful-studio
2. Select a product from the catalog
3. Upload artwork
4. Select variants (checkboxes)
5. Generate preview mockups (Design tab)
6. Create product (Review tab)

### Expected Behavior

- ✅ Mockups generate for all selected variants
- ✅ Uses correct placement type (default/mockup)
- ✅ Polls until completion or timeout
- ✅ Extracts URLs from nested response structure
- ✅ Uploads mockups to Medusa storage
- ✅ Creates product with mockup images

## Future Improvements

1. **Webhook Support**: Instead of polling, use Printful webhooks for async mockup completion
2. **Caching**: Cache mockup results by artwork + variant combination
3. **Batch Optimization**: Group variants with same style requirements
4. **Error Recovery**: Retry failed tasks with exponential backoff
5. **Progress Tracking**: Real-time progress updates in UI during generation
6. **Style Selection UI**: Allow users to choose specific mockup styles/views

## Related Documentation

- [PRINTFUL_STUDIO_IMPLEMENTATION.md](./PRINTFUL_STUDIO_IMPLEMENTATION.md) - Full studio implementation
- [PRINTFUL_STUDIO_REDESIGN.md](./PRINTFUL_STUDIO_REDESIGN.md) - Architecture redesign
- [Studio_ADDENDUM.md](./Studio_ADDENDUM.md) - Additional notes
