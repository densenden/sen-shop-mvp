# V1 API Implementation Plan

## Status: Ready to implement after clean restart

## Summary
Printful V2 API only has 37 apparel products. To get frames, posters, home decor (200+ products), we need V1 API support.

**Key principle:** Same UI wizard, `version` parameter routes internally. NO CODE DUPLICATION.

---

## 1. Add V1 Methods to Service

**File:** `sen-commerce/src/modules/printful/services/printful-pod-product-service.ts`

**Insert after line 171 (after `getSyncProduct` method):**

```typescript
  // V1 API: Fetch ALL catalog products (200+ products including frames, posters, home decor)
  private v1CatalogCache: { data: any[], fetchedAt: number } | null = null

  async fetchV1CatalogProducts(forceRefresh = false): Promise<any[]> {
    if (!forceRefresh && this.v1CatalogCache && Date.now() - this.v1CatalogCache.fetchedAt < this.cacheTTL) {
      console.log('[PrintfulService] Using cached V1 catalog products')
      return this.v1CatalogCache.data
    }

    console.log('[PrintfulService] Fetching V1 catalog products: /products')
    const res = await fetch(`${this.apiBaseUrlV1}/products`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    })

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") || "15"
        throw new Error(`Printful rate limit reached. Try again after ${retryAfter} seconds.`)
      }
      const errorText = await res.text()
      console.error("Printful V1 catalog products error:", res.status, errorText)
      throw new Error("Failed to fetch V1 catalog products from Printful")
    }

    const data = await res.json()
    const products = Array.isArray(data.result) ? data.result : []
    console.log(`[PrintfulService] Fetched ${products.length} V1 catalog products`)

    this.v1CatalogCache = { data: products, fetchedAt: Date.now() }
    return products
  }

  // V1 API: Get single product details with variants
  async getV1Product(productId: string): Promise<any> {
    console.log(`[PrintfulService] Fetching V1 product: ${productId}`)
    const res = await fetch(`${this.apiBaseUrlV1}/products/${productId}`, {
      headers: { Authorization: `Bearer ${this.apiToken}` }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V1 product fetch error:", res.status, errorText)
      throw new Error(`Failed to fetch V1 product ${productId}`)
    }

    const data = await res.json()
    return data.result
  }

  // V1 API: Generate mockup
  async generateV1Mockup(taskKey: string, params: {
    variant_ids: number[]
    format: string
    files: Array<{
      placement: string
      image_url: string
      position?: { area_width: number, area_height: number, width: number, height: number, top: number, left: number }
    }>
  }): Promise<any> {
    console.log(`[PrintfulService] Creating V1 mockup task: ${taskKey}`, params)

    const res = await fetch(`${this.apiBaseUrlV1}/mockup-generator/create-task/${taskKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V1 mockup generation error:", res.status, errorText)
      throw new Error(`Failed to generate V1 mockup: ${res.status}`)
    }

    const data = await res.json()
    console.log('[PrintfulService] V1 mockup task created:', data.result?.task_key)
    return data.result
  }

  // V1 API: Get mockup task result (polling)
  async getV1MockupTask(taskKey: string): Promise<any> {
    const res = await fetch(`${this.apiBaseUrlV1}/mockup-generator/task?task_key=${taskKey}`, {
      headers: { Authorization: `Bearer ${this.apiToken}` }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V1 mockup task fetch error:", res.status, errorText)
      throw new Error(`Failed to fetch V1 mockup task`)
    }

    const data = await res.json()
    return data.result
  }

  // V1 API: Fetch product templates (saved designs)
  async fetchV1ProductTemplates(): Promise<any[]> {
    console.log('[PrintfulService] Fetching V1 product templates')
    const res = await fetch(`${this.apiBaseUrlV1}/product-templates`, {
      headers: { Authorization: `Bearer ${this.apiToken}` }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V1 product templates error:", res.status, errorText)
      throw new Error("Failed to fetch V1 product templates")
    }

    const data = await res.json()
    const templates = Array.isArray(data.result) ? data.result : []
    console.log(`[PrintfulService] Fetched ${templates.length} V1 product templates`)
    return templates
  }
```

---

## 2. Create V1 Catalog Route

**File:** `sen-commerce/src/api/admin/printful-studio/v1/catalog/route.ts` (NEW)

```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const printfulService = req.scope.resolve("printfulPodProductService")

    const products = await printfulService.fetchV1CatalogProducts()

    res.json({ products, total: products.length })
  } catch (error: any) {
    console.error("[v1-catalog] Error fetching V1 catalog:", error)
    res.status(500).json({ error: error.message })
  }
}
```

---

## 3. Create V1 Product Details Route

**File:** `sen-commerce/src/api/admin/printful-studio/v1/catalog/[productId]/route.ts` (NEW)

```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { productId } = req.params

  try {
    const printfulService = req.scope.resolve("printfulPodProductService")
    const product = await printfulService.getV1Product(productId)

    res.json({ product })
  } catch (error: any) {
    console.error(`[v1-catalog] Error fetching V1 product ${productId}:`, error)
    res.status(500).json({ error: error.message })
  }
}
```

---

## 4. Add V1 Templates Route

**File:** `sen-commerce/src/api/admin/printful-studio/v1/templates/route.ts` (NEW)

```typescript
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const printfulService = req.scope.resolve("printfulPodProductService")
    const templates = await printfulService.fetchV1ProductTemplates()

    res.json({ templates, total: templates.length })
  } catch (error: any) {
    console.error("[v1-templates] Error fetching templates:", error)
    res.status(500).json({ error: error.message })
  }
}
```

---

## 5. Update UI to Support Both Versions

**File:** `sen-commerce/src/admin/routes/printful-studio-simple/page.tsx`

**Add state for API version:**
```typescript
const [apiVersion, setApiVersion] = useState<'v1' | 'v2'>('v2')
```

**Add version toggle at Step 2 (before product grid):**
```tsx
{/* API Version Toggle */}
<div className="mb-6 flex items-center justify-between">
  <div className="flex items-center gap-4">
    <Label>Catalog Version:</Label>
    <div className="flex gap-2">
      <Button
        variant={apiVersion === 'v2' ? 'primary' : 'secondary'}
        size="small"
        onClick={() => setApiVersion('v2')}
      >
        V2 Modern (37 apparel)
      </Button>
      <Button
        variant={apiVersion === 'v1' ? 'primary' : 'secondary'}
        size="small"
        onClick={() => setApiVersion('v1')}
      >
        V1 Full Catalog (200+ products, frames)
      </Button>
    </div>
  </div>
</div>
```

**Update product loading:**
```typescript
useEffect(() => {
  if (step === 2) {
    setLoading(true)
    const endpoint = apiVersion === 'v1'
      ? '/admin/printful-studio/v1/catalog'
      : '/admin/printful-studio/v2/catalog'

    fetch(endpoint, { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setProducts(data.products || [])
        setLoading(false)
      })
  }
}, [step, apiVersion])
```

---

## 6. Testing Steps

After restart:
1. Refresh UI
2. Click V1 toggle
3. Verify 200+ products load (including frames)
4. Select frame product (e.g., product ID 71)
5. Generate mockups (V1 mockup-generator)
6. Verify entire workflow uses V1

---

## Key Differences: V1 vs V2

| Feature | V1 | V2 |
|---------|----|----|
| Products | 200+ (frames, posters, home decor) | 37 (apparel only) |
| Endpoint | `/products` | `/v2/catalog-products` |
| Mockups | `/mockup-generator/create-task/{id}` | `/v2/mockup-tasks` |
| Style Control | Basic | Advanced (`mockup_style_ids`) |
| Templates | ✅ `/product-templates` | ❌ Not supported |

---

## Commit Message
```
feat: Add complete V1 API support for full product catalog

- Add V1 catalog products endpoint (200+ products vs 37 in V2)
- Add V1 mockup generation (/mockup-generator)
- Add V1 product templates support
- Add UI toggle to switch between V1 (full catalog) and V2 (modern)
- V1 includes frames, posters, home decor missing from V2
- Same wizard UI, version parameter routes to correct API internally

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```
