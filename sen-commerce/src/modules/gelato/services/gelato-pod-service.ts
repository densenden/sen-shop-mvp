import { MedusaService } from "@medusajs/framework/utils"

/**
 * Gelato POD Service
 *
 * Gelato API uses templates created in their dashboard
 * Workflow:
 * 1. Create product templates in Gelato dashboard with variants, mockup styles
 * 2. Use API to create products from templates by passing artwork URL
 * 3. Gelato generates mockups automatically in background
 * 4. Fetch product to get generated mockup URLs
 */
export class GelatoPodService extends MedusaService({}) {
  private apiKey: string
  private storeId: string
  private apiBaseUrl: string
  private productApiUrl: string
  private container: any
  private templateCache: { data: any[]; fetchedAt: number } | null = null
  private cacheTTL = 300000 // 5 minutes cache for templates

  constructor(container: any, options?: any) {
    super(container, options)
    this.container = container
    this.apiKey = process.env.GELATO_API_KEY || ""
    this.storeId = process.env.GELATO_STORE_ID || ""
    this.apiBaseUrl = "https://ecommerce.gelatoapis.com/v1"
    this.productApiUrl = "https://product.gelatoapis.com/v3"
  }

  private getAuthHeaders() {
    return {
      "X-API-KEY": this.apiKey,
      "Content-Type": "application/json"
    }
  }

  /**
   * Search product catalog
   * GET /v3/catalogs/{catalogUid}/products:search
   */
  async searchCatalogProducts(catalogUid: string = "default", filters?: any): Promise<any[]> {
    try {
      const url = `${this.productApiUrl}/catalogs/${catalogUid}/products:search`
      console.log('[GelatoService] Searching catalog products:', url)

      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(filters || {})
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[GelatoService] Catalog search error:', res.status, errorText)
        throw new Error(`Failed to search Gelato catalog: ${res.status}`)
      }

      const data = await res.json()
      const products = data.products || []
      console.log(`[GelatoService] Found ${products.length} catalog products`)
      return products
    } catch (error) {
      console.error('[GelatoService] Error searching catalog:', error)
      return []
    }
  }

  /**
   * Get single catalog product details
   * GET /v3/products/{productUid}
   */
  async getCatalogProduct(productUid: string): Promise<any | null> {
    try {
      const url = `${this.productApiUrl}/products/${productUid}`
      console.log('[GelatoService] Fetching product:', url)

      const res = await fetch(url, {
        headers: this.getAuthHeaders()
      })

      if (!res.ok) {
        if (res.status === 404) return null
        const errorText = await res.text()
        console.error('[GelatoService] Product fetch error:', res.status, errorText)
        return null
      }

      const data = await res.json()
      return data
    } catch (error) {
      console.error('[GelatoService] Error fetching product:', error)
      return null
    }
  }

  /**
   * List all stores associated with this API key
   * GET /v1/stores
   */
  async listStores(): Promise<any[]> {
    try {
      const url = `${this.apiBaseUrl}/stores`
      console.log('[GelatoService] Fetching stores:', url)

      const res = await fetch(url, {
        headers: this.getAuthHeaders()
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[GelatoService] Stores fetch error:', res.status, errorText)
        return []
      }

      const data = await res.json()
      const stores = data.stores || []
      console.log(`[GelatoService] Found ${stores.length} stores:`, stores.map((s: any) => ({ id: s.id, name: s.name })))
      return stores
    } catch (error) {
      console.error('[GelatoService] Error fetching stores:', error)
      return []
    }
  }

  /**
   * List product templates (your store's products which serve as templates)
   * GET /v1/stores/{storeId}/products
   */
  async fetchProductTemplates(forceRefresh = false): Promise<any[]> {
    if (!forceRefresh && this.templateCache && Date.now() - this.templateCache.fetchedAt < this.cacheTTL) {
      console.log('[GelatoService] Using cached templates')
      return this.templateCache.data
    }

    try {
      const url = `${this.apiBaseUrl}/stores/${this.storeId}/products`
      console.log('[GelatoService] Fetching product templates:', url)

      const res = await fetch(url, {
        headers: this.getAuthHeaders()
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[GelatoService] Templates fetch error:', res.status, errorText)
        return []
      }

      const data = await res.json()
      const templates = data.products || []
      console.log(`[GelatoService] Fetched ${templates.length} product templates`)
      if (templates.length > 0) {
        console.log('[GelatoService] Sample product:', JSON.stringify(templates[0], null, 2))
      }

      this.templateCache = { data: templates, fetchedAt: Date.now() }
      return templates
    } catch (error) {
      console.error('[GelatoService] Error fetching templates:', error)
      return []
    }
  }

  /**
   * Get single template details
   * GET /v1/stores/{storeName}/product-templates/{templateId}
   */
  async getProductTemplate(templateId: string): Promise<any | null> {
    try {
      const url = `${this.apiBaseUrl}/stores/${this.storeId}/product-templates/${templateId}`
      console.log('[GelatoService] Fetching template:', url)

      const res = await fetch(url, {
        headers: this.getAuthHeaders()
      })

      if (!res.ok) {
        if (res.status === 404) return null
        const errorText = await res.text()
        console.error('[GelatoService] Template fetch error:', res.status, errorText)
        return null
      }

      const data = await res.json()
      return data
    } catch (error) {
      console.error('[GelatoService] Error fetching template:', error)
      return null
    }
  }

  /**
   * Create product from template
   * POST /v1/stores/{storeName}/products:create-from-template
   *
   * Pass artwork URL and template ID. Gelato will:
   * 1. Create product with variants
   * 2. Generate mockups in background
   * 3. Return product ID immediately
   */
  async createProductFromTemplate(templateId: string, artworkUrl: string, productData?: {
    title?: string
    description?: string
  }): Promise<any> {
    try {
      const url = `${this.apiBaseUrl}/stores/${this.storeId}/products:create-from-template`
      console.log('[GelatoService] Creating product from template:', templateId)

      const payload = {
        templateId,
        designUrl: artworkUrl,
        title: productData?.title,
        description: productData?.description
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[GelatoService] Product creation error:', res.status, errorText)
        throw new Error(`Failed to create product from template: ${res.status}`)
      }

      const data = await res.json()
      console.log('[GelatoService] Product created:', data.id || data.productId)
      return data
    } catch (error) {
      console.error('[GelatoService] Error creating product:', error)
      throw error
    }
  }

  /**
   * Get product with mockups
   * GET /v1/stores/{storeName}/products/{productId}
   *
   * Mockups are generated in background. Poll this endpoint to check status.
   */
  async getProduct(productId: string): Promise<any | null> {
    try {
      const url = `${this.apiBaseUrl}/stores/${this.storeId}/products/${productId}`
      console.log('[GelatoService] Fetching product with mockups:', url)

      const res = await fetch(url, {
        headers: this.getAuthHeaders()
      })

      if (!res.ok) {
        if (res.status === 404) return null
        const errorText = await res.text()
        console.error('[GelatoService] Product fetch error:', res.status, errorText)
        return null
      }

      const data = await res.json()
      return data
    } catch (error) {
      console.error('[GelatoService] Error fetching product:', error)
      return null
    }
  }

  /**
   * List all products in store
   * GET /v1/stores/{storeName}/products
   */
  async listProducts(): Promise<any[]> {
    try {
      const url = `${this.apiBaseUrl}/stores/${this.storeId}/products`
      console.log('[GelatoService] Listing store products:', url)

      const res = await fetch(url, {
        headers: this.getAuthHeaders()
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[GelatoService] Products list error:', res.status, errorText)
        return []
      }

      const data = await res.json()
      const products = data.products || []
      console.log(`[GelatoService] Found ${products.length} store products`)
      return products
    } catch (error) {
      console.error('[GelatoService] Error listing products:', error)
      return []
    }
  }

  /**
   * Wait for mockups to be generated
   * Polls product endpoint until mockups are ready
   */
  async waitForMockups(productId: string, maxWaitTime: number = 60000): Promise<string[]> {
    const startTime = Date.now()
    const pollInterval = 5000 // 5 seconds

    console.log('[GelatoService] Waiting for mockups to be generated...')

    while (Date.now() - startTime < maxWaitTime) {
      const product = await this.getProduct(productId)

      if (!product) {
        throw new Error('Product not found')
      }

      // Check if mockups are ready
      const mockups = product.mockups || product.variants?.flatMap((v: any) => v.mockups || []) || []
      const mockupUrls = mockups.map((m: any) => m.url || m.imageUrl).filter(Boolean)

      if (mockupUrls.length > 0) {
        console.log(`[GelatoService] Mockups ready! Found ${mockupUrls.length} mockups`)
        return mockupUrls
      }

      console.log('[GelatoService] Mockups not ready yet, waiting...')
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }

    throw new Error('Mockup generation timeout')
  }

  /**
   * Create order
   * POST /v1/stores/{storeName}/orders
   */
  async createOrder(orderData: any): Promise<any> {
    try {
      const url = `${this.apiBaseUrl}/stores/${this.storeId}/orders`
      console.log('[GelatoService] Creating order')

      const res = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderData)
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('[GelatoService] Order creation error:', res.status, errorText)
        throw new Error(`Failed to create order: ${res.status}`)
      }

      const data = await res.json()
      console.log('[GelatoService] Order created:', data.id || data.orderId)
      return data
    } catch (error) {
      console.error('[GelatoService] Error creating order:', error)
      throw error
    }
  }

  /**
   * Get order
   * GET /v1/stores/{storeName}/orders/{orderId}
   */
  async getOrder(orderId: string): Promise<any | null> {
    try {
      const url = `${this.apiBaseUrl}/stores/${this.storeId}/orders/${orderId}`

      const res = await fetch(url, {
        headers: this.getAuthHeaders()
      })

      if (!res.ok) {
        if (res.status === 404) return null
        const errorText = await res.text()
        console.error('[GelatoService] Order fetch error:', res.status, errorText)
        return null
      }

      const data = await res.json()
      return data
    } catch (error) {
      console.error('[GelatoService] Error fetching order:', error)
      return null
    }
  }
}
