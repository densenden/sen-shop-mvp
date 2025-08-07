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

  constructor(container: any, options?: any) {
    super(container, options)
    this.container = container
    this.apiToken = process.env.PRINTFUL_API_TOKEN || ""
    this.orderService = new PrintfulOrderService(container, options)
    this.apiBaseUrlV1 = "https://api.printful.com"
    this.apiBaseUrlV2 = "https://api.printful.com/v2"
  }

  // V2 API: Fetch catalog products (available for printing)
  async fetchCatalogProducts(): Promise<PrintfulV2CatalogProduct[]> {
    const res = await fetch(`${this.apiBaseUrlV2}/catalog-products`, {
      headers: { 
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
    })
    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful V2 API error:", res.status, errorText)
      throw new Error("Failed to fetch catalog products from Printful V2")
    }
    const data = await res.json()
    return data.data || []
  }

  // V2 API: Get specific catalog product with variants
  async getCatalogProduct(productId: string): Promise<PrintfulV2CatalogProduct | null> {
    const res = await fetch(`${this.apiBaseUrlV2}/catalog-products/${productId}`, {
      headers: { 
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
    })
    if (!res.ok) {
      if (res.status === 404) return null
      const errorText = await res.text()
      console.error("Printful V2 API error:", res.status, errorText)
      throw new Error("Failed to fetch catalog product from Printful V2")
    }
    const data = await res.json()
    return data.data || null
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
    
    // The Printful API returns data in result.sync_product with variants in result.sync_variants
    if (data.result && data.result.sync_product) {
      const syncProduct = data.result.sync_product
      const syncVariants = data.result.sync_variants || []
      
      // Map to expected format
      return {
        id: syncProduct.id.toString(),
        name: syncProduct.name,
        thumbnail_url: syncProduct.thumbnail_url,
        description: syncProduct.description,
        variants: syncVariants.map((v: any) => ({
          id: v.id.toString(),
          name: v.name,
          price: parseFloat(v.retail_price),
          currency: v.currency || 'USD'
        }))
      }
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

  // Enhanced product import with mockups
  async importProductWithMockups(printfulProduct: PrintfulV2StoreProduct, artworkUrl?: string): Promise<any> {
    let mockupUrls: string[] = []
    
    if (artworkUrl && printfulProduct.variants.length > 0) {
      try {
        // Take first few variants to generate mockups
        const variantIds = printfulProduct.variants.slice(0, 3).map(v => v.id)
        mockupUrls = await this.generateAndWaitForMockups(printfulProduct.id, variantIds, artworkUrl)
        console.log(`Generated ${mockupUrls.length} mockups for product ${printfulProduct.id}`)
      } catch (error) {
        console.warn(`Failed to generate mockups for product ${printfulProduct.id}:`, error)
        // Continue with import even if mockups fail
      }
    }

    // Create product with mockup images
    const productImages = [printfulProduct.thumbnail_url, ...mockupUrls].filter(Boolean)
    
    const productInput = {
      title: printfulProduct.name,
      description: printfulProduct.description || `${printfulProduct.name} - Custom print-on-demand product`,
      thumbnail: productImages[0],
      images: productImages.map(url => ({ url })),
      status: "published",
      metadata: {
        printful_product_id: printfulProduct.id,
        mockup_urls: mockupUrls,
        artwork_url: artworkUrl,
        fulfillment_type: "printful_pod"
      }
    }

    return productInput
  }
} 