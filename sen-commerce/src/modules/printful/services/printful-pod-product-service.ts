import { MedusaService } from "@medusajs/framework/utils"
import { PrintfulProduct } from "../models/printful-product"

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

// This service handles fetching and importing Printful products using V2 API
export class PrintfulPodProductService extends MedusaService({
  PrintfulProduct,
}) {
  private apiToken: string
  private apiBaseUrlV1: string
  private apiBaseUrlV2: string
  private container: any

  constructor(container: any, options?: any) {
    super(container, options)
    this.container = container
    this.apiToken = process.env.PRINTFUL_API_TOKEN || ""
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
    return data.result || []
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
} 