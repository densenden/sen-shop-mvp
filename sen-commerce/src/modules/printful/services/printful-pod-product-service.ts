import { MedusaService } from "@medusajs/framework/utils"
import { PrintfulProduct } from "../models/printful-product"
import { PrintfulOrderService } from "./printful-order-service"

interface PrintfulV2CatalogProduct {
  id: string
  name: string
  description?: string
  image: string
  brand: string
  model: string
  category: string
  variants: PrintfulV2Variant[]
}

interface PrintfulV2Variant {
  id: string
  name: string
  size?: string
  color?: string
  price: number
  currency: string
  image: string
  availability: string
}

interface PrintfulV2StoreProduct {
  id: string
  name: string
  thumbnail_url: string
  description?: string
  variants: PrintfulV2StoreVariant[]
}

interface PrintfulV2StoreVariant {
  id: string
  name: string
  price: number
  currency: string
  files: PrintfulV2File[]
}

interface PrintfulV2File {
  id: string
  type: string
  url: string
  preview_url: string
}

interface PrintfulV2Order {
  id: string
  status: string
  items: PrintfulV2OrderItem[]
  shipping: PrintfulV2ShippingInfo
  total: number
  currency: string
}

interface PrintfulV2OrderItem {
  id: string
  variant_id: string
  quantity: number
  price: number
  files: PrintfulV2File[]
}

interface PrintfulV2ShippingInfo {
  name: string
  address1: string
  address2?: string
  city: string
  state_code: string
  country_code: string
  zip: string
}

interface PrintfulV2MockupRequest {
  product_id: string
  variant_ids: string[]
  files: {
    id: string
    url: string
    type: string
  }[]
  options?: {
    layout?: string
    orientation?: string
    background?: string
  }
}

interface PrintfulV2MockupResponse {
  id: string
  status: string
  mockups: {
    variant_id: string
    mockup_url: string
    placement_id: string
  }[]
}

// This service handles fetching and importing Printful products using V2 API
export class PrintfulPodProductService extends MedusaService({
  PrintfulProduct,
}) {
  private apiToken: string
  private apiBaseUrlV1: string
  private apiBaseUrlV2: string
  private container: any
  private orderService: PrintfulOrderService
  private syncProductsCache: { data: any[]; fetchedAt: number } | null = null
  private catalogProductsCache: { data: PrintfulV2CatalogProduct[]; fetchedAt: number } | null = null
  private cacheTTL = 15000 // 15 seconds to stay within Printful rate limits

  constructor(container: any, options?: any) {
    super(container, options)
    this.container = container
    this.apiToken = process.env.PRINTFUL_API_TOKEN || ""
    this.orderService = new PrintfulOrderService(container, options)
    this.apiBaseUrlV1 = "https://api.printful.com"
    this.apiBaseUrlV2 = "https://api.printful.com/v2"
  }

  clearCaches() {
    this.syncProductsCache = null
    this.catalogProductsCache = null
  }

  // V1 API: Fetch sync products (templates that can be pushed to the store)
  async fetchSyncProducts(forceRefresh = false): Promise<any[]> {
    if (!forceRefresh && this.syncProductsCache && Date.now() - this.syncProductsCache.fetchedAt < this.cacheTTL) {
      return this.syncProductsCache.data
    }

    const res = await fetch(`${this.apiBaseUrlV1}/sync/products`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    })

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") || "15"
        throw new Error(`Printful rate limit reached. Try again after ${retryAfter} seconds.`)
      }
      const errorText = await res.text()
      console.error("Printful V1 sync products error:", res.status, errorText)
      throw new Error("Failed to fetch sync products from Printful")
    }

    const data = await res.json()
    const products = Array.isArray(data.result) ? data.result : []
    this.syncProductsCache = { data: products, fetchedAt: Date.now() }
    return products
  }

  async getSyncProduct(productId: string): Promise<any | null> {
    const res = await fetch(`${this.apiBaseUrlV1}/sync/products/${productId}`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    })

    if (!res.ok) {
      if (res.status === 404) {
        return null
      }
      const errorText = await res.text()
      console.error("Printful sync product fetch error:", res.status, errorText)
      throw new Error("Failed to fetch sync product from Printful")
    }

    const data = await res.json()
    return data.result || null
  }

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

  // V2 API: Fetch catalog products (available for printing)
  async fetchCatalogProducts(forceRefresh = false, options?: { category_id?: string, limit?: number, offset?: number }): Promise<PrintfulV2CatalogProduct[]> {
    // Don't use cache if filtering by category or pagination
    const useCache = !forceRefresh && !options?.category_id && !options?.offset

    if (useCache && this.catalogProductsCache && Date.now() - this.catalogProductsCache.fetchedAt < this.cacheTTL) {
      return this.catalogProductsCache.data
    }

    // Build query parameters
    const params = new URLSearchParams()
    if (options?.category_id) params.append('category_id', options.category_id)
    // V2 API returns max 37 products total - always request limit=100 to get all available
    if (options?.limit) params.append('limit', options.limit.toString())
    else if (!options?.offset) params.append('limit', '100') // Get all on first request
    if (options?.offset) params.append('offset', options.offset.toString())

    const url = `${this.apiBaseUrlV2}/catalog-products${params.toString() ? '?' + params.toString() : ''}`

    console.log(`[PrintfulService] Fetching catalog products: ${url}`)

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
    })

    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After") || "15"
        throw new Error(`Printful catalog rate limit reached. Try again after ${retryAfter} seconds.`)
      }
      const errorText = await res.text()
      console.error("Printful V2 API error:", res.status, errorText)
      throw new Error("Failed to fetch catalog products from Printful V2")
    }

    const data = await res.json()
    const products = data.data || []
    const total = data.paging?.total || data.total || products.length
    const hasMore = data.paging?.has_more || false

    console.log(`[PrintfulService] Fetched ${products.length}/${total} catalog products`, {
      has_more: hasMore,
      paging: data.paging,
      will_fetch_all: hasMore && !options?.offset && !options?.limit
    })

    // If there are more products and no pagination was requested, fetch all
    if (hasMore && !options?.offset && !options?.limit) {
      console.log(`[PrintfulService] Fetching remaining products (total: ${total})`)
      const remainingProducts = await this.fetchAllCatalogProducts(products.length, total, options?.category_id)
      const allProducts = [...products, ...remainingProducts]

      // Only cache if fetching all products without filters
      if (!options?.category_id) {
        this.catalogProductsCache = { data: allProducts, fetchedAt: Date.now() }
      }

      return allProducts
    }

    // Cache if fetching all products without filters
    if (!options?.category_id && !options?.offset) {
      this.catalogProductsCache = { data: products, fetchedAt: Date.now() }
    }

    return products
  }

  // Helper to fetch all remaining catalog products
  private async fetchAllCatalogProducts(currentCount: number, total: number, categoryId?: string): Promise<PrintfulV2CatalogProduct[]> {
    const allProducts: PrintfulV2CatalogProduct[] = []
    const limit = 100 // Printful's max per request
    let offset = currentCount

    while (offset < total) {
      try {
        const batch = await this.fetchCatalogProducts(false, {
          category_id: categoryId,
          limit,
          offset
        })

        if (batch.length === 0) break

        allProducts.push(...batch)
        offset += batch.length

        console.log(`[PrintfulService] Progress: ${offset}/${total} products fetched`)

        // Rate limiting: wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`[PrintfulService] Error fetching batch at offset ${offset}:`, error)
        break
      }
    }

    return allProducts
  }

  // V2 API: Get specific catalog product with variants
  async getCatalogProduct(productId: string): Promise<PrintfulV2CatalogProduct | null> {
    try {
      console.log(`[PrintfulService] Fetching V2 catalog product ${productId}`)

      // Fetch product details
      const productRes = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
      })

      if (!productRes.ok) {
        if (productRes.status === 404) {
          console.log(`[PrintfulService] V2 catalog product ${productId} not found`)
          return null
        }
        const errorText = await productRes.text()
        console.error("Printful V2 API error:", productRes.status, errorText)
        return null
      }

      const productData = await productRes.json()

      if (!productData.data) {
        return null
      }

      const catalogProduct = productData.data

      // Fetch variants separately - V2 API requires this
      console.log(`[PrintfulService] Fetching variants for product ${productId}`)
      const variantsRes = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}/catalog-variants`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
      })

      if (variantsRes.ok) {
        const variantsData = await variantsRes.json()
        catalogProduct.variants = variantsData.data || []
        console.log(`[PrintfulService] Loaded ${catalogProduct.variants.length} variants for product ${productId}`)
      } else {
        console.warn(`[PrintfulService] Failed to fetch variants, using empty array`)
        catalogProduct.variants = []
      }

      // Extract placements and techniques from the product data
      const placements = catalogProduct.placements || []
      const techniques = catalogProduct.techniques || []

      // Extract available product options (e.g., stitch_color)
      // Note: Printful V2 catalog API often doesn't return product options
      // They're typically only required/validated during mockup generation
      const productOptions = catalogProduct.options || []

      // Attach product_options to catalogProduct for frontend access
      catalogProduct.product_options = productOptions

      console.log(`[PrintfulService] V2 Catalog product details:`)
      console.log(`  - ID: ${catalogProduct.id}`)
      console.log(`  - Name: ${catalogProduct.name}`)
      console.log(`  - Image: ${catalogProduct.image}`)
      console.log(`  - Variants: ${catalogProduct.variants?.length || 0}`)
      console.log(`  - Placements: ${placements.length}`, placements.map((p: any) => p.placement || p.id || p))
      console.log(`  - Techniques: ${techniques.length}`, techniques.map((t: any) => t.id || t.technique || t))
      console.log(`  - Product Options: ${productOptions.length}`, productOptions.map((o: any) => o.key || o.id))

      return catalogProduct
    } catch (error) {
      console.error(`[PrintfulService] Error fetching V2 catalog product ${productId}:`, error)
      return null
    }
  }

  // V1 API: Fetch store products (still needed for store operations)
  async fetchStoreProducts(): Promise<PrintfulV2StoreProduct[]> {
    const res = await fetch(`${this.apiBaseUrlV1}/store/products`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    })
    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V1 API error:", res.status, errorText)
      throw new Error("Failed to fetch store products from Printful")
    }
    const data = await res.json()
    
    // Printful returns an array of sync products
    if (data.result && Array.isArray(data.result)) {
      return data.result.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        thumbnail_url: item.thumbnail_url,
        description: item.description,
        // For listing, we don't need full variants, just basic info
        variants: []
      }))
    }
    
    return []
  }

  // V1 API: Get specific store product
  async getStoreProduct(productId: string): Promise<PrintfulV2StoreProduct | null> {
    const res = await fetch(`${this.apiBaseUrlV1}/store/products/${productId}`, {
      headers: { Authorization: `Bearer ${this.apiToken}` },
    })
    if (!res.ok) {
      if (res.status === 404) return null
      const errorText = await res.text()
      console.error("Printful V1 API error:", res.status, errorText)
      throw new Error("Failed to fetch store product from Printful")
    }
    const data = await res.json()
    
    console.log(`[PrintfulService] Raw API response for product ${productId}:`)
    console.log(JSON.stringify(data, null, 2))
    
    // The Printful API returns data in result.sync_product with variants in result.sync_variants
    if (data.result && data.result.sync_product) {
      const syncProduct = data.result.sync_product
      const syncVariants = data.result.sync_variants || []
      
      console.log(`[PrintfulService] Sync product:`, syncProduct)
      console.log(`[PrintfulService] Found ${syncVariants.length} sync variants`)
      syncVariants.forEach((variant, index) => {
        console.log(`[PrintfulService] Variant ${index}:`, JSON.stringify(variant, null, 2))
      })
      
      // Map to expected format
      const mappedProduct = {
        id: syncProduct.id.toString(),
        name: syncProduct.name,
        thumbnail_url: syncProduct.thumbnail_url,
        description: syncProduct.description,
        variants: syncVariants.map((v: any) => ({
          id: v.id.toString(),
          name: v.name,
          price: parseFloat(v.retail_price),
          currency: v.currency || 'USD',
          image: v.image || v.preview_url,
          files: v.files || [] // Include files array for additional images
        }))
      }
      
      console.log(`[PrintfulService] ✅ Final mapped product structure:`)
      console.log(`  - Product ID: ${mappedProduct.id}`)
      console.log(`  - Product Name: ${mappedProduct.name}`)
      console.log(`  - Thumbnail: ${mappedProduct.thumbnail_url}`)
      console.log(`  - Variants: ${mappedProduct.variants.length}`)
      mappedProduct.variants.forEach((variant, index) => {
        console.log(`    Variant ${index}: ${variant.name} - Files: ${variant.files.length}`)
        variant.files.forEach((file, fileIndex) => {
          console.log(`      File ${fileIndex}: ${file.type} -> ${file.preview_url || file.url}`)
        })
      })
      
      return mappedProduct
    }
    
    return data.result || null
  }

  // V1 API: Create store product
  async createStoreProduct(productData: any): Promise<PrintfulV2StoreProduct> {
    const res = await fetch(`${this.apiBaseUrlV1}/store/products`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    })
    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V1 API error:", res.status, errorText)
      throw new Error("Failed to create store product in Printful")
    }
    const data = await res.json()
    return data.result
  }

  // V1 API: Update store product
  async updateStoreProduct(productId: string, productData: any): Promise<PrintfulV2StoreProduct> {
    const res = await fetch(`${this.apiBaseUrlV1}/store/products/${productId}`, {
      method: 'PUT',
      headers: { 
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    })
    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V1 API error:", res.status, errorText)
      throw new Error("Failed to update store product in Printful")
    }
    const data = await res.json()
    return data.result
  }

  // V1 API: Delete store product
  async deleteStoreProduct(productId: string): Promise<boolean> {
    const res = await fetch(`${this.apiBaseUrlV1}/store/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.apiToken}` },
    })
    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V1 API error:", res.status, errorText)
      throw new Error("Failed to delete store product from Printful")
    }
    return true
  }

  // Create Medusa product from Printful data
  async createMedusaProduct(printfulProduct: PrintfulV2StoreProduct, artworkId?: string) {
    const { createProductsWorkflow } = require("@medusajs/medusa/core-flows")
    
    // Prepare the product input
    const input = {
      products: [{
        title: printfulProduct.name,
        description: printfulProduct.description || "",
        thumbnail: printfulProduct.thumbnail_url,
        images: [{ url: printfulProduct.thumbnail_url }],
        is_giftcard: false,
        discountable: true,
        status: "published",
        handle: printfulProduct.name.toLowerCase().replace(/\s+/g, '-'),
        // Add custom metadata to link to Printful
        metadata: {
          printful_product_id: printfulProduct.id,
          artwork_id: artworkId,
          product_type: "printful_pod"
        }
      }]
    }
    
    // Run the workflow to create the product
    const { result } = await createProductsWorkflow(this.container).run({ input })
    return result[0]
  }

  // Sync Printful product to local database
  async syncPrintfulProduct(printfulProduct: PrintfulV2StoreProduct, artworkId?: string) {
    const existingProducts = await this.listPrintfulProducts({
      filters: { printful_product_id: printfulProduct.id }
    })

    if (existingProducts.length > 0) {
      // Update existing product
      const updated = await this.updatePrintfulProducts({
        id: existingProducts[0].id,
        name: printfulProduct.name,
        thumbnail_url: printfulProduct.thumbnail_url,
        artwork_id: artworkId,
        price: printfulProduct.variants?.[0]?.price || null
      })
      return updated
    } else {
      // Create new product
      const created = await this.createPrintfulProducts({
        printful_product_id: printfulProduct.id,
        name: printfulProduct.name,
        thumbnail_url: printfulProduct.thumbnail_url,
        artwork_id: artworkId,
        price: printfulProduct.variants?.[0]?.price || null
      })
      return created
    }
  }

  // Get all products with their linked artwork info
  async getProductsWithArtwork() {
    const products = await this.listPrintfulProducts()
    // You can enhance this to join with artwork data
    return products
  }

  // Helper methods for CRUD operations
  async findPrintfulProduct(id: string) {
    const results = await this.listPrintfulProducts({ filters: { id } })
    return results[0] || null
  }

  async findPrintfulProductByPrintfulId(printfulId: string) {
    const results = await this.listPrintfulProducts({ filters: { printful_product_id: printfulId } })
    return results[0] || null
  }

  // Order methods - delegate to PrintfulOrderService
  async createOrder(orderData: any) {
    return this.orderService.createOrder(orderData)
  }

  async getOrder(orderId: string) {
    return this.orderService.getOrder(orderId)
  }

  async updateOrder(orderId: string, orderData: any) {
    return this.orderService.updateOrder(orderId, orderData)
  }

  async cancelOrder(orderId: string) {
    return this.orderService.cancelOrder(orderId)
  }

  async getOrders(params?: any) {
    return this.orderService.getOrders(params)
  }

  // V2 API: Fetch catalog categories
  async fetchCatalogCategories(): Promise<Array<{ id: string; name: string; parent_id?: string }>> {
    try {
      const res = await fetch(`${this.apiBaseUrlV2}/catalog-categories`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        console.warn(`[PrintfulService] Failed to fetch catalog categories:`, res.status)
        return []
      }

      const data = await res.json()
      const categories = data.data || []

      console.log(`[PrintfulService] Fetched ${categories.length} catalog categories`)

      return categories
    } catch (error) {
      console.warn('[PrintfulService] Error fetching catalog categories:', error)
      return []
    }
  }

  // V2 API: Fetch user's saved templates
  async fetchTemplates(): Promise<Array<{ id: string; name: string; preview_url?: string; product_id?: string }>> {
    try {
      const res = await fetch(`${this.apiBaseUrlV2}/templates`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        console.warn(`[PrintfulService] Failed to fetch templates:`, res.status)
        return []
      }

      const data = await res.json()
      const templates = data.data || []

      console.log(`[PrintfulService] Fetched ${templates.length} templates`)

      return templates
    } catch (error) {
      console.warn('[PrintfulService] Error fetching templates:', error)
      return []
    }
  }

  // V1 API: Fetch detailed template information by ID
  async fetchTemplateDetails(templateId: string): Promise<any | null> {
    try {
      const res = await fetch(`${this.apiBaseUrlV1}/store/products/${templateId}`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        console.warn(`[PrintfulService] Failed to fetch template ${templateId}:`, res.status)
        return null
      }

      const data = await res.json()
      const template = data.result || data

      console.log(`[PrintfulService] Fetched template ${templateId} details:`, {
        id: template.id,
        name: template.sync_product?.name,
        variants: template.sync_variants?.length
      })

      return template
    } catch (error) {
      console.warn(`[PrintfulService] Error fetching template ${templateId}:`, error)
      return null
    }
  }

  // V2 API: Get available mockup styles for a product
  async getMockupStyles(productId: string): Promise<any[]> {
    try {
      const res = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}/mockup-styles`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        console.warn(`[PrintfulService] Failed to fetch mockup styles for product ${productId}:`, res.status)
        return []
      }

      const data = await res.json()
      const placements = data.data || []

      // Return placements grouped by placement/technique to preserve relationship
      // This is the proper structure for the frontend
      const placementGroups = placements.map((placement: any) => ({
        placement: placement.placement,
        technique: placement.technique,
        display_name: placement.display_name,
        print_area_width: placement.print_area_width,
        print_area_height: placement.print_area_height,
        dpi: placement.dpi,
        mockup_styles: placement.mockup_styles || []
      }))

      const totalStyles = placementGroups.reduce((sum: number, p: any) => sum + (p.mockup_styles?.length || 0), 0)
      console.log(`[PrintfulService] Loaded ${placements.length} placement/technique groups with ${totalStyles} total mockup styles`)

      if (placementGroups.length > 0 && placementGroups[0].mockup_styles?.length > 0) {
        console.log('[PrintfulService] First placement group:', {
          placement: placementGroups[0].placement,
          technique: placementGroups[0].technique,
          styles_count: placementGroups[0].mockup_styles.length
        })
      }

      return placementGroups
    } catch (error) {
      console.warn('[PrintfulService] Error fetching mockup styles:', error)
      return []
    }
  }

  // V2 API: Generate mockups for a product with artwork
  async generateMockups(productId: string, variantIds: string[], artworkUrl: string, placement?: string, technique?: string, mockupStyleIds?: string[], productOptions?: Record<string, string>): Promise<PrintfulV2MockupResponse> {
    // Fetch available mockup styles for this product
    const mockupStyles = await this.getMockupStyles(productId)
    console.log(`[PrintfulService] Found ${mockupStyles.length} mockup styles for product ${productId}`)

    if (mockupStyles.length > 0) {
      console.log('[PrintfulService] First mockup style:', mockupStyles[0])
      console.log('[PrintfulService] All mockup style keys:', Object.keys(mockupStyles[0]))
    }

    // mockupStyles is now an array of placement groups
    // Each group has: { placement, technique, mockup_styles: [...] }

    // Determine which placement/technique to use
    let finalPlacement = placement ? String(placement) : undefined
    let finalTechnique = technique ? String(technique) : undefined
    let selectedPlacementGroup: any = null

    // If user selected specific mockup style IDs, find which placement group they belong to
    if (mockupStyleIds && mockupStyleIds.length > 0 && mockupStyles.length > 0) {
      for (const group of mockupStyles) {
        const hasMatchingStyle = group.mockup_styles?.some((style: any) =>
          mockupStyleIds.includes(String(style.id))
        )
        if (hasMatchingStyle) {
          selectedPlacementGroup = group
          finalPlacement = String(group.placement)
          finalTechnique = String(group.technique)
          console.log(`[PrintfulService] Using placement/technique from selected styles: ${finalPlacement}/${finalTechnique}`)
          break
        }
      }
    }

    // Fall back to first placement group if not set
    if (!selectedPlacementGroup && mockupStyles.length > 0) {
      selectedPlacementGroup = mockupStyles[0]
      finalPlacement = String(selectedPlacementGroup.placement)
      finalTechnique = String(selectedPlacementGroup.technique)
      console.log(`[PrintfulService] Auto-selected first placement/technique: ${finalPlacement}/${finalTechnique}`)
    }

    // Ensure they are strings
    finalPlacement = String(finalPlacement || 'default')
    finalTechnique = String(finalTechnique || 'DTG')

    console.log('[PrintfulService] Mockup generation config:', {
      total_placement_groups: mockupStyles.length,
      selected_placement: finalPlacement,
      selected_technique: finalTechnique,
      user_selected_style_ids: mockupStyleIds?.length || 0,
      mode: mockupStyleIds?.length ? 'user-selected styles' : 'auto-select per variant'
    })

    // V2 API uses /mockup-tasks endpoint
    // Strategy: Create ONE request per variant with style IDs at PRODUCT level
    // Per official docs: mockup_style_ids goes at product level, NOT placement level
    const products = variantIds.map(variantId => {
      const product: any = {
        source: 'catalog',
        catalog_product_id: parseInt(productId, 10),
        catalog_variant_ids: [parseInt(variantId, 10)],
        placements: [{
          placement: finalPlacement,
          technique: finalTechnique,
          layers: [{
            type: 'file',
            url: artworkUrl
          }]
        }]
      }

      // Add mockup_style_ids at PRODUCT level (per official API docs)
      if (mockupStyleIds && mockupStyleIds.length > 0) {
        product.mockup_style_ids = [parseInt(mockupStyleIds[0], 10)]
        console.log(`[PrintfulService] *** Setting mockup_style_ids=[${mockupStyleIds[0]}] at PRODUCT level for variant ${variantId} ***`)
      }

      // Add product options if provided (e.g., stitch_color)
      if (productOptions && Object.keys(productOptions).length > 0) {
        product.options = productOptions
      }

      return product
    })

    const requestData: any = {
      format: 'jpg',
      products: products
    }

    // NOTE: mockup_style_id is set per placement (in products array above)
    // DO NOT set mockup_style_ids at root level - it causes all requests to return the same mockup

    console.log('[PrintfulService] Generating mockups with V2 mockup-tasks API:', {
      product_id: productId,
      variant_count: variantIds.length,
      variant_ids: variantIds,
      artwork_url: artworkUrl,
      placement: finalPlacement,
      technique: finalTechnique,
      mockup_style_id: mockupStyleIds?.[0] || 'auto-select'
    })

    console.log('[PrintfulService] Raw mockup task request payload:', JSON.stringify(requestData, null, 2))

    // CRITICAL DEBUG: Log the exact mockup_style_ids being sent at product level
    if (requestData.products?.[0]?.mockup_style_ids) {
      console.log(`[PrintfulService] *** CONFIRMED: Sending mockup_style_ids=${JSON.stringify(requestData.products[0].mockup_style_ids)} at PRODUCT level ***`)
    } else {
      console.log(`[PrintfulService] *** WARNING: No mockup_style_ids at product level - Printful will auto-select ***`)
    }

    const res = await fetch(`${this.apiBaseUrlV2}/mockup-tasks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[PrintfulService] Mockup API error:', {
        status: res.status,
        statusText: res.statusText,
        body: errorText
      })

      // Handle rate limit specifically
      if (res.status === 429) {
        const errorData = JSON.parse(errorText)
        const waitSeconds = errorData.error?.message?.match(/(\d+) seconds/)?.[1] || '60'
        throw new Error(`Rate limit exceeded. Please wait ${waitSeconds} seconds before trying again.`)
      }

      throw new Error(`Failed to generate mockups: ${res.status} ${errorText}`)
    }

    const data = await res.json()
    console.log('[PrintfulService] Raw mockup task response:', JSON.stringify(data, null, 2))

    // Response is an array of tasks when requesting multiple variants
    const tasks = data.data || data
    const tasksArray = Array.isArray(tasks) ? tasks : [tasks]

    // Log any warnings or errors from Printful
    if (data.warnings) {
      console.warn('[PrintfulService] ⚠️  Printful API warnings:', data.warnings)
    }
    if (data.errors) {
      console.error('[PrintfulService] ❌ Printful API errors:', data.errors)
    }

    console.log('[PrintfulService] Mockup tasks created:', {
      task_count: tasksArray.length,
      task_ids: tasksArray.map((t: any) => t.id),
      requested_styles: mockupStyleIds?.length || 'auto',
      requested_variants: variantIds.length,
      expected_mockups: mockupStyleIds?.length ? variantIds.length * mockupStyleIds.length : variantIds.length
    })

    // Return array of task IDs for polling
    return {
      id: tasksArray.map((t: any) => t.id).join(','), // Store as comma-separated for backward compat
      task_ids: tasksArray.map((t: any) => t.id),
      status: 'pending',
      mockups: []
    }
  }

  // V2 API: Get mockup generation status and download URLs
  async getMockupStatus(taskId: string): Promise<PrintfulV2MockupResponse> {
    const res = await fetch(`${this.apiBaseUrlV2}/mockup-tasks?id=${taskId}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      const errorText = await res.text()

      // Handle rate limiting with retry-after
      if (res.status === 429) {
        let retryAfter = 60 // Default to 60 seconds
        try {
          const errorData = JSON.parse(errorText)
          const match = errorData.data?.match(/after (\d+) seconds?/)
          if (match) {
            retryAfter = parseInt(match[1], 10)
          }
        } catch (e) {
          // Fallback to parsing from text
        }

        console.warn(`[PrintfulService] Rate limited. Retry after ${retryAfter}s for task ${taskId}`)
        const error: any = new Error(`Rate limited: retry after ${retryAfter}s`)
        error.retryAfter = retryAfter
        error.status = 429
        throw error
      }

      console.error('[PrintfulService] Mockup status API error:', res.status, errorText)
      throw new Error(`Failed to get mockup status: ${res.status}`)
    }

    const data = await res.json()
    const tasks = data.data || data
    const task = Array.isArray(tasks) ? tasks[0] : tasks

    console.log('[PrintfulService] Raw task response for', taskId, ':', JSON.stringify(task, null, 2))

    // V2 API uses catalog_variant_mockups instead of mockups
    const mockups = task.catalog_variant_mockups || []

    console.log('[PrintfulService] Mockup task status:', {
      task_id: taskId,
      status: task.status,
      mockup_count: mockups.length,
      sample_mockup: mockups.length > 0 ? JSON.stringify(mockups[0]) : null
    })

    // Normalize response - extract mockup URLs from the nested structure
    // Each catalog_variant_mockups entry has a nested mockups array
    const flattenedMockups = mockups.flatMap((variantMockup: any) => {
      const innerMockups = variantMockup.mockups || []
      console.log(`[PrintfulService] Variant ${variantMockup.catalog_variant_id} has ${innerMockups.length} mockups`)
      return innerMockups.map((m: any) => ({
        mockup_url: m.mockup_url,
        variant_id: variantMockup.catalog_variant_id,
        placement: m.placement,
        technique: m.technique,
        style_id: m.style_id,
        view: m.view
      }))
    })

    console.log('[PrintfulService] Total mockups across all variants:', flattenedMockups.length)

    return {
      id: task.id,
      status: task.status,
      mockups: flattenedMockups
    }
  }

  // Helper method to wait for mockup generation and return URLs
  async generateAndWaitForMockups(productId: string, variantIds: string[], artworkUrl: string, maxWaitTime: number = 30000, placement?: string, technique?: string, mockupStyleIds?: string[], productOptions?: Record<string, string>): Promise<string[]> {
    console.log('[PrintfulService] generateAndWaitForMockups called with:', {
      productId,
      variantCount: variantIds.length,
      variantIds,
      maxWaitTime,
      placement,
      technique,
      mockupStyleIds: mockupStyleIds || 'auto-select',
      productOptions: productOptions || 'none'
    })

    // Start mockup generation (will auto-detect placement/technique if not provided)
    const mockupTask = await this.generateMockups(productId, variantIds, artworkUrl, placement, technique, mockupStyleIds, productOptions)

    // Get task IDs (may be multiple tasks for multiple variants)
    const taskIds = (mockupTask as any).task_ids || [mockupTask.id]

    // Poll for completion of all tasks with rate limiting
    const startTime = Date.now()
    let pollInterval = 10000 // Start with 10 seconds between polls (respects rate limit)
    let pollCount = 0
    let rateLimitWait = 0

    console.log(`[PrintfulService] ⏳ Starting mockup polling for ${taskIds.length} tasks (rate limit: ~2 requests/minute)`)

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval + rateLimitWait))
      pollCount++
      rateLimitWait = 0 // Reset after waiting

      try {
        console.log(`[PrintfulService] 🔄 Poll #${pollCount}: Checking ${taskIds.length} mockup task(s)...`)

        // Poll tasks SEQUENTIALLY with delay to respect rate limit (2 req/min = 1 req per 30s)
        const statuses: PrintfulV2MockupResponse[] = []
        for (let i = 0; i < taskIds.length; i++) {
          const taskId = taskIds[i]

          // Add delay between requests (30 seconds for 2 req/min limit)
          if (i > 0) {
            const delayMs = 30000 // 30 seconds between requests
            console.log(`[PrintfulService] ⏱️  Waiting ${delayMs/1000}s before next request (rate limit)...`)
            await new Promise(resolve => setTimeout(resolve, delayMs))
          }

          try {
            const status = await this.getMockupStatus(taskId)
            statuses.push(status)
            console.log(`[PrintfulService] ✓ Task ${i+1}/${taskIds.length}: ${status.status}`)
          } catch (error: any) {
            if (error.status === 429 && error.retryAfter) {
              console.warn(`[PrintfulService] ⚠️  Rate limited! Waiting ${error.retryAfter}s before retry...`)
              rateLimitWait = error.retryAfter * 1000
              break // Stop polling this round, wait longer
            }
            throw error
          }
        }

        if (statuses.length === 0) {
          console.log(`[PrintfulService] No statuses retrieved (rate limited), will retry...`)
          continue
        }

        // Check if all completed
        const allCompleted = statuses.every(s => s.status === 'completed')
        const anyFailed = statuses.some(s => s.status === 'failed')

        if (anyFailed) {
          throw new Error('One or more mockup generation tasks failed')
        }

        if (allCompleted) {
          // Collect all mockup URLs from all tasks
          const allMockups = statuses.flatMap(s => s.mockups || [])
          const urls = allMockups.map(m => m.mockup_url)

          console.log('[PrintfulService] ✅ All mockups completed:', {
            task_count: taskIds.length,
            total_mockups: urls.length,
            expected_variants: variantIds.length,
            mockup_style_ids_requested: mockupStyleIds?.length || 'auto-select',
            expected_with_styles: mockupStyleIds?.length ? variantIds.length * mockupStyleIds.length : variantIds.length,
            poll_count: pollCount,
            total_time_s: Math.round((Date.now() - startTime) / 1000)
          })

          console.log('[PrintfulService] Mockup details:', allMockups.map((m, idx) => ({
            index: idx + 1,
            variant_id: m.variant_id,
            mockup_style_id: m.mockup_style_id || 'not provided',
            url: m.mockup_url
          })))

          return urls
        }

        const completed = statuses.filter(s => s.status === 'completed').length
        const pending = statuses.filter(s => s.status === 'pending').length
        console.log(`[PrintfulService] 📊 Progress: ${completed}/${statuses.length} completed, ${pending} pending`)

        // Continue polling if any still processing
      } catch (error: any) {
        console.warn('[PrintfulService] ❌ Error checking mockup status:', error.message)
      }
    }

    throw new Error(`Mockup generation timed out after ${Math.round(maxWaitTime/1000)}s (${pollCount} polling attempts)`)
  }

  // Legacy method - use ProductImageService for comprehensive image collection instead
  // This method is deprecated in favor of ProductImageService.collectPrintfulImages()
  async importProductWithMockups(printfulProduct: PrintfulV2StoreProduct, artworkUrl?: string): Promise<any> {
    console.warn('[PrintfulPodProductService] importProductWithMockups is deprecated. Use ProductImageService.collectPrintfulImages() instead.')

    // Simple fallback for basic product structure
    const productInput = {
      title: printfulProduct.name,
      description: printfulProduct.description || `${printfulProduct.name} - Custom print-on-demand product`,
      thumbnail: printfulProduct.thumbnail_url,
      images: printfulProduct.thumbnail_url ? [{ url: printfulProduct.thumbnail_url }] : [],
      status: "published",
      metadata: {
        printful_product_id: printfulProduct.id,
        artwork_url: artworkUrl,
        fulfillment_type: "printful_pod",
        total_images: printfulProduct.thumbnail_url ? 1 : 0,
        image_sources: {
          mockups: 0,
          catalog: 0,
          variants: 0
        }
      }
    }

    return productInput
  }

  // ===== Printful Studio Methods =====

  /**
   * Upload artwork file to Printful Files API
   * V1 API: POST /files
   */
  async uploadArtworkToPrintful(fileUrl: string, fileName?: string): Promise<{
    id: string
    url: string
    preview_url?: string
    filename: string
  }> {
    const payload: any = {
      url: fileUrl,
      type: 'default'
    }

    if (fileName) {
      payload.filename = fileName
    }

    const res = await fetch(`${this.apiBaseUrlV1}/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Printful Files API error:', res.status, errorText)
      throw new Error('Failed to upload file to Printful')
    }

    const data = await res.json()
    return data.result || data
  }

  /**
   * Get Printful file details
   * V1 API: GET /files/:id
   */
  async getPrintfulFile(fileId: string): Promise<any> {
    const res = await fetch(`${this.apiBaseUrlV1}/files/${fileId}`, {
      headers: { Authorization: `Bearer ${this.apiToken}` }
    })

    if (!res.ok) {
      if (res.status === 404) return null
      const errorText = await res.text()
      console.error('Printful Files API error:', res.status, errorText)
      throw new Error('Failed to get file from Printful')
    }

    const data = await res.json()
    return data.result || data
  }

  /**
   * Create a new sync product on Printful
   * V1 API: POST /store/products (Note: /sync/products is READ-ONLY)
   */
  async createSyncProduct(productData: {
    name: string
    description?: string
    thumbnail_url?: string
    variants: Array<{
      variant_id: number
      retail_price: string
      files?: Array<{
        id?: string
        url?: string
        type: string
      }>
    }>
  }): Promise<any> {
    const payload = {
      sync_product: {
        name: productData.name,
        thumbnail: productData.thumbnail_url
      },
      sync_variants: productData.variants.map(v => ({
        variant_id: v.variant_id,
        retail_price: v.retail_price,
        files: v.files || []
      }))
    }

    console.log('[PrintfulService] Creating sync product with payload:', JSON.stringify(payload, null, 2))

    // Use /store/products endpoint, not /sync/products
    // /sync/products is READ-ONLY (GET only)
    const res = await fetch(`${this.apiBaseUrlV1}/store/products`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[PrintfulService] Printful Store Products API error:', {
        status: res.status,
        statusText: res.statusText,
        errorBody: errorText
      })

      let errorDetails = errorText
      try {
        const errorJson = JSON.parse(errorText)
        errorDetails = errorJson.error?.message || errorJson.message || errorText
      } catch (e) {
        // Not JSON, use as is
      }

      throw new Error(`Printful API error (${res.status}): ${errorDetails}`)
    }

    const data = await res.json()
    console.log('[PrintfulService] Sync product created, response:', data)
    return data.result || data
  }

  /**
   * Update an existing sync product on Printful
   * V1 API: PUT /store/products/:id
   */
  async updateSyncProduct(productId: string, productData: {
    name?: string
    description?: string
    thumbnail_url?: string
    variants?: Array<{
      id?: string
      variant_id: number
      retail_price: string
      files?: Array<{
        id?: string
        url?: string
        type: string
      }>
    }>
  }): Promise<any> {
    const payload: any = {}

    if (productData.name || productData.thumbnail_url) {
      payload.sync_product = {}
      if (productData.name) payload.sync_product.name = productData.name
      if (productData.thumbnail_url) payload.sync_product.thumbnail = productData.thumbnail_url
    }

    if (productData.variants) {
      payload.sync_variants = productData.variants.map(v => ({
        id: v.id,
        variant_id: v.variant_id,
        retail_price: v.retail_price,
        files: v.files || []
      }))
    }

    const res = await fetch(`${this.apiBaseUrlV1}/store/products/${productId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Printful Store Products API error:', res.status, errorText)
      throw new Error('Failed to update sync product on Printful')
    }

    const data = await res.json()
    return data.result || data
  }

  /**
   * Delete a sync product from Printful
   * V1 API: DELETE /store/products/:id
   */
  async deleteSyncProduct(productId: string): Promise<void> {
    const res = await fetch(`${this.apiBaseUrlV1}/store/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${this.apiToken}` }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Printful Store Products API error:', res.status, errorText)
      throw new Error('Failed to delete sync product from Printful')
    }
  }

  /**
   * Get available product templates from catalog
   * V2 API: GET /v2/catalog-products with details
   */
  async getCatalogProductWithTemplates(productId: string): Promise<any> {
    const product = await this.getCatalogProduct(productId)
    if (!product) return null

    // Fetch mockup templates for this product
    try {
      const res = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}/mockup-templates`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (res.ok) {
        const data = await res.json()
        return {
          ...product,
          mockup_templates: data.data || []
        }
      }
    } catch (error) {
      console.warn('Failed to fetch mockup templates:', error)
    }

    return product
  }

  /**
   * Get variant details with pricing and techniques
   * V2 API: GET /v2/catalog-variants/:id
   */
  async getCatalogVariant(variantId: string): Promise<any> {
    const res = await fetch(`${this.apiBaseUrlV2}/catalog-variants/${variantId}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      if (res.status === 404) return null
      const errorText = await res.text()
      console.error('Printful V2 Catalog Variants API error:', res.status, errorText)
      return null
    }

    const data = await res.json()
    return data.data || data
  }

  /**
   * Get pricing for a catalog variant
   * V2 API: GET /v2/catalog-variants/:id/prices
   */
  async getVariantPricing(variantId: string, quantity: number = 1): Promise<any> {
    const res = await fetch(`${this.apiBaseUrlV2}/catalog-variants/${variantId}/prices?quantity=${quantity}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Printful V2 Pricing API error:', res.status, errorText)
      return null
    }

    const data = await res.json()
    return data.data || data
  }
} 
