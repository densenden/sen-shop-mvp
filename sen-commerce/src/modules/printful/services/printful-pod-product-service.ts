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

  // V2 API: Fetch catalog products (available for printing)
  async fetchCatalogProducts(forceRefresh = false): Promise<PrintfulV2CatalogProduct[]> {
    if (!forceRefresh && this.catalogProductsCache && Date.now() - this.catalogProductsCache.fetchedAt < this.cacheTTL) {
      return this.catalogProductsCache.data
    }

    const res = await fetch(`${this.apiBaseUrlV2}/catalog-products`, {
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
    this.catalogProductsCache = { data: products, fetchedAt: Date.now() }
    return products
  }

  // V2 API: Get specific catalog product with variants
  async getCatalogProduct(productId: string): Promise<PrintfulV2CatalogProduct | null> {
    try {
      console.log(`[PrintfulService] Fetching V2 catalog product ${productId}`)
      const res = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}`, {
        headers: { 
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
      })
      
      if (!res.ok) {
        if (res.status === 404) {
          console.log(`[PrintfulService] V2 catalog product ${productId} not found`)
          return null
        }
        const errorText = await res.text()
        console.error("Printful V2 API error:", res.status, errorText)
        return null
      }
      
      const data = await res.json()
      console.log(`[PrintfulService] V2 Catalog API response for product ${productId}:`)
      console.log(JSON.stringify(data, null, 2))
      
      if (data.data) {
        const catalogProduct = data.data
        console.log(`[PrintfulService] V2 Catalog product details:`)
        console.log(`  - ID: ${catalogProduct.id}`)
        console.log(`  - Name: ${catalogProduct.name}`)
        console.log(`  - Image: ${catalogProduct.image}`)
        console.log(`  - Variants: ${catalogProduct.variants?.length || 0}`)
        
        catalogProduct.variants?.forEach((variant: any, index: number) => {
          console.log(`  - V2 Variant ${index}: ${variant.name} - Image: ${variant.image}`)
        })
        
        return catalogProduct
      }
      
      return null
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

  // V2 API: Generate mockups for a product with artwork
  async generateMockups(productId: string, variantIds: string[], artworkUrl: string): Promise<PrintfulV2MockupResponse> {
    const requestData: PrintfulV2MockupRequest = {
      product_id: productId,
      variant_ids: variantIds,
      files: [{
        id: 'artwork',
        url: artworkUrl,
        type: 'front'
      }],
      options: {
        layout: 'product_only',
        background: 'white'
      }
    }

    const res = await fetch(`${this.apiBaseUrlV2}/mockups`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V2 Mockup API error:", res.status, errorText)
      throw new Error("Failed to generate mockups from Printful V2")
    }

    const data = await res.json()
    return data.data || data
  }

  // V2 API: Get mockup generation status and download URLs
  async getMockupStatus(taskId: string): Promise<PrintfulV2MockupResponse> {
    const res = await fetch(`${this.apiBaseUrlV2}/mockups/${taskId}`, {
      headers: { 
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V2 Mockup Status API error:", res.status, errorText)
      throw new Error("Failed to get mockup status from Printful V2")
    }

    const data = await res.json()
    return data.data || data
  }

  // Helper method to wait for mockup generation and return URLs
  async generateAndWaitForMockups(productId: string, variantIds: string[], artworkUrl: string, maxWaitTime: number = 30000): Promise<string[]> {
    // Start mockup generation
    const mockupTask = await this.generateMockups(productId, variantIds, artworkUrl)
    
    if (mockupTask.status === 'completed') {
      return mockupTask.mockups.map(m => m.mockup_url)
    }

    // Poll for completion
    const startTime = Date.now()
    const pollInterval = 2000 // 2 seconds

    while (Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, pollInterval))
      
      try {
        const status = await this.getMockupStatus(mockupTask.id)
        
        if (status.status === 'completed') {
          return status.mockups.map(m => m.mockup_url)
        } else if (status.status === 'failed') {
          throw new Error('Mockup generation failed')
        }
        // Continue polling if status is still 'processing'
      } catch (error) {
        console.warn('Error checking mockup status:', error)
      }
    }

    throw new Error('Mockup generation timed out')
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
} 
