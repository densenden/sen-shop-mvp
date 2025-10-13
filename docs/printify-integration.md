# Printify POD Integration

This document outlines the Printify integration implementation for SenShop, including API structure differences from Printful and key adjustments made to support Printify blueprints.

## Overview

Printify has been integrated as a third POD provider alongside Printful V1 and Printful V2. The integration supports:
- 1186+ blueprint catalog
- Blueprint details and variants
- Print provider selection
- Product creation with artwork placement
- Pagination and filtering for large catalogs

## Architecture

### Module Structure

```
sen-commerce/src/modules/printify/
├── index.ts                    # Module definition
└── services/
    └── printify-service.ts     # API wrapper service
```

### API Routes

```
sen-commerce/src/api/admin/printful-studio/printify/
├── shops/route.ts                          # List shops
├── catalog/route.ts                        # List all blueprints
├── blueprints/[id]/route.ts                # Blueprint details
└── create-product/route.ts                 # Create product
```

## Key Differences: Printify vs Printful

### API Response Structure

| Field | Printful | Printify | Notes |
|-------|----------|----------|-------|
| Product/Blueprint | `product` | `blueprint` | Printify uses "blueprints" as templates |
| Product Options | `product_options: [{key, values}]` | N/A | Printify doesn't expose product options |
| Variants | `variants: [{id, size, color, ...}]` | `variants: [{id, title, options: {size, color}}]` | Different structure |
| Mockup Styles | `mockup_styles: [{id, name}]` | N/A | Printify uses print providers instead |
| Category | `category_id` | `brand`, `model` | Printify organizes by brand/model |
| Images | `thumbnail_url` | `images: [url1, url2, ...]` | Printify returns array |

### Response Transformation

To maintain frontend compatibility, the backend transforms Printify responses to match Printful structure:

**Blueprint Details (`/blueprints/[id]/route.ts`):**
```typescript
const transformedProduct = {
  id: blueprintDetails.id,
  title: blueprintDetails.title,
  description: blueprintDetails.description,
  brand: blueprintDetails.brand,
  model: blueprintDetails.model,
  images: blueprintDetails.images || [],

  variants: variants.map((v: any) => ({
    id: v.id,
    title: v.title,
    size: v.options?.size || v.title,
    color: v.options?.color || '',
    price: v.cost || 0,
    is_available: v.is_enabled !== false
  })),

  // Critical: Add empty product_options to prevent frontend errors
  product_options: [],

  printify_provider_id: firstProvider?.id,
  printify_providers: providers?.data || providers || []
}
```

## Frontend Integration

### Provider Selection

**File:** `sen-commerce/src/admin/routes/printful-studio-simple/page.tsx`

The POD Studio now supports three providers:

```typescript
const [provider, setProvider] = useState<'printful-v1' | 'printful-v2' | 'printify'>('printful-v2')
```

### Catalog Loading

Different endpoints per provider:

```typescript
let endpoint = '/admin/printful-studio/v2/catalog'
if (provider === 'printful-v1') {
  endpoint = '/admin/printful-studio/v1/catalog'
} else if (provider === 'printify') {
  endpoint = '/admin/printful-studio/printify/catalog'
}
```

### Product Selection Logic

When selecting a Printify blueprint, mockup styles are skipped:

```typescript
if (provider === 'printify') {
  res = await fetch(`/admin/printful-studio/printify/blueprints/${product.id}`, { credentials: "include" })
  data = await res.json()
  mockupStyles = [] // Printify blueprints don't have mockup styles
} else {
  // Printful V1/V2 logic with mockup styles
}
```

## Performance Optimizations

### Pagination & Filtering

To handle Printify's large catalog (1186+ blueprints), pagination and filtering were implemented:

**State Management:**
```typescript
const [allProducts, setAllProducts] = useState<any[]>([]) // All products from API
const [products, setProducts] = useState<any[]>([])       // Filtered/paginated products
const [currentPage, setCurrentPage] = useState(1)
const [itemsPerPage] = useState(50)
const [searchTerm, setSearchTerm] = useState("")
const [selectedBrand, setSelectedBrand] = useState<string>("all")
```

**Filtering Logic:**
```typescript
const { filteredProducts, paginatedProducts, totalPages } = useMemo(() => {
  let filtered = allProducts

  // Search filter (name, title, brand, model)
  if (searchTerm) {
    const search = searchTerm.toLowerCase()
    filtered = filtered.filter(p =>
      (p.name?.toLowerCase().includes(search)) ||
      (p.title?.toLowerCase().includes(search)) ||
      (p.brand?.toLowerCase().includes(search)) ||
      (p.model?.toLowerCase().includes(search))
    )
  }

  // Brand filter
  if (selectedBrand !== "all") {
    filtered = filtered.filter(p => p.brand === selectedBrand)
  }

  // Pagination
  const total = Math.ceil(filtered.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const paginated = filtered.slice(startIdx, startIdx + itemsPerPage)

  return { filteredProducts: filtered, paginatedProducts: paginated, totalPages: total }
}, [allProducts, searchTerm, selectedBrand, currentPage, itemsPerPage])
```

**UI Features:**
- Search bar: Filters by name, title, brand, or model
- Brand dropdown: Shows all unique brands with product counts
- Pagination controls: Previous/Next buttons, page indicator
- Lazy loading: Images load only when in viewport
- Results counter: Shows "X of Y products"

These features apply to **all POD providers** (Printful V1, V2, and Printify).

## Configuration

### Environment Variables

Add to `.env`:
```bash
PRINTIFY_API_TOKEN=your_api_token_here
PRINTIFY_SHOP_NAME=your_shop_name_here
```

### Module Registration

In `medusa-config.ts`:
```typescript
modules: [
  {
    resolve: "./src/modules/printify",
    alias: "printifyModule",
    definition: { isQueryable: true }
  }
]
```

## API Endpoints Reference

### List Shops
```
GET /admin/printful-studio/printify/shops
Response: { shops: [...] }
```

### List Blueprints
```
GET /admin/printful-studio/printify/catalog
Response: { products: [...], count: 1186 }
```

### Blueprint Details
```
GET /admin/printful-studio/printify/blueprints/:id
Response: { product: {...}, variants: [...], providers: [...] }
```

### Create Product
```
POST /admin/printful-studio/printify/create-product
Body: { blueprint_id, print_provider_id, variants, title, description }
Response: { product: {...} }
```

## Known Limitations

1. **No Mockup Styles**: Printify doesn't provide mockup style selection like Printful V2
2. **No Category API**: Printify doesn't support server-side category filtering
3. **Client-Side Filtering**: All 1186 blueprints load at once, then filtered client-side
4. **Brand/Model Only**: Filtering limited to brand and model fields (no category taxonomy)

## Troubleshooting

### Error: "Cannot read properties of undefined (reading 'product_options')"

**Cause**: Frontend expects `product_options` field from Printful API, but Printify doesn't provide it.

**Solution**: Backend transformation adds empty `product_options: []` array in `/blueprints/[id]/route.ts`

### Slow Image Loading

**Cause**: Loading 1186+ product thumbnails simultaneously.

**Solution**:
- Pagination limits to 50 products per page
- Lazy loading with `loading="lazy"` attribute
- Search/filter to reduce visible products

### Module Resolution Error

**Cause**: Printify module not registered or wrong path.

**Solution**: Check `medusa-config.ts` has correct module path and restart server.

## Future Improvements

- [ ] Server-side pagination API (if Printify adds support)
- [ ] Category taxonomy mapping (brand → category)
- [ ] Mockup generation via Printify's mockup API
- [ ] Print provider selection UI
- [ ] Variant pricing optimization
- [ ] Bulk product import from Printify catalog
