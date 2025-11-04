import {
  PODProvider,
  PODProduct,
  PODProductData,
  PODVariant,
  PODOrderData,
  PODOrder,
  PODFulfillmentResult,
  PODFulfillmentStatus,
  ProviderCapability,
  ProviderHealthStatus,
  RateLimitConfig
} from "../../printful/services/pod-provider-facade"
import GelatoService from "./gelato-service"

export class GelatoProvider implements PODProvider {
  name = 'Gelato'
  type = 'gelato'
  isEnabled = true

  capabilities: ProviderCapability = {
    products: true,
    orders: true,
    fulfillment: true,
    webhooks: true,
    catalogBrowsing: true,
    bulkOperations: true, // Gelato has good bulk support
    customSizing: true,
    mockupGeneration: false // Gelato uses templates instead
  }

  rateLimitConfig: RateLimitConfig = {
    requestsPerSecond: 10, // Gelato has higher rate limits
    burstLimit: 20,
    cooldownPeriod: 500
  }

  private gelatoService: GelatoService
  private lastRequestTime = 0

  constructor(container: any) {
    this.gelatoService = new GelatoService(container)
  }

  // Rate limiting helper
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    const minInterval = 1000 / this.rateLimitConfig.requestsPerSecond

    if (timeSinceLastRequest < minInterval) {
      const delay = minInterval - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, delay))
    }

    this.lastRequestTime = Date.now()
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const startTime = Date.now()
    try {
      await this.enforceRateLimit()

      // Try to list products as a simple health check
      await this.gelatoService.listProducts({ limit: 1 })
      const responseTime = Date.now() - startTime

      return {
        isHealthy: true,
        lastChecked: new Date(),
        responseTime
      }
    } catch (error) {
      return {
        isHealthy: false,
        lastChecked: new Date(),
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async fetchProducts(): Promise<PODProduct[]> {
    await this.enforceRateLimit()

    try {
      const response = await this.gelatoService.listProducts()
      const products = response.products || response.data || []

      return products.map((product: any) => this.mapGelatoToPODProduct(product))
    } catch (error) {
      console.error('[GelatoProvider] Failed to fetch products:', error)
      throw error
    }
  }

  async getProduct(productId: string): Promise<PODProduct | null> {
    await this.enforceRateLimit()

    try {
      const product = await this.gelatoService.getProduct(productId)
      return product ? this.mapGelatoToPODProduct(product) : null
    } catch (error) {
      console.error(`[GelatoProvider] Failed to get product ${productId}:`, error)
      return null
    }
  }

  async createProduct(productData: PODProductData): Promise<PODProduct> {
    await this.enforceRateLimit()

    try {
      // Gelato uses template-based product creation
      const gelatoData = this.mapPODDataToGelato(productData)
      const product = await this.gelatoService.createProductFromTemplate(gelatoData)
      return this.mapGelatoToPODProduct(product)
    } catch (error) {
      console.error('[GelatoProvider] Failed to create product:', error)
      throw error
    }
  }

  async updateProduct(productId: string, productData: Partial<PODProductData>): Promise<PODProduct> {
    // Gelato doesn't have a direct update endpoint, need to recreate or use their update logic
    await this.enforceRateLimit()

    try {
      // For now, throw an error as Gelato's API might not support direct updates
      // In a real implementation, you'd need to check their actual API capabilities
      throw new Error('Product updates not yet implemented for Gelato provider')
    } catch (error) {
      console.error(`[GelatoProvider] Failed to update product ${productId}:`, error)
      throw error
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    // Gelato might not support product deletion, or it might be a different workflow
    await this.enforceRateLimit()

    try {
      // Since Gelato's API might not have direct deletion, return false for now
      console.warn(`[GelatoProvider] Product deletion not supported for product ${productId}`)
      return false
    } catch (error) {
      console.error(`[GelatoProvider] Failed to delete product ${productId}:`, error)
      return false
    }
  }

  async createOrder(orderData: PODOrderData): Promise<PODOrder> {
    await this.enforceRateLimit()

    try {
      const gelatoOrderData = this.mapPODOrderToGelato(orderData)
      const order = await this.gelatoService.createOrder(gelatoOrderData)
      return this.mapGelatoToPODOrder(order)
    } catch (error) {
      console.error('[GelatoProvider] Failed to create order:', error)
      throw error
    }
  }

  async getOrder(orderId: string): Promise<PODOrder | null> {
    await this.enforceRateLimit()

    try {
      const order = await this.gelatoService.getOrder(orderId)
      return order ? this.mapGelatoToPODOrder(order) : null
    } catch (error) {
      console.error(`[GelatoProvider] Failed to get order ${orderId}:`, error)
      return null
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    await this.enforceRateLimit()

    try {
      await this.gelatoService.cancelOrder(orderId)
      return true
    } catch (error) {
      console.error(`[GelatoProvider] Failed to cancel order ${orderId}:`, error)
      return false
    }
  }

  async processFulfillment(medusaOrder: any): Promise<PODFulfillmentResult> {
    try {
      // Convert Medusa order to Gelato order format and submit
      const orderData = this.convertMedusaOrderToGelato(medusaOrder)
      const order = await this.createOrder(orderData)

      return {
        success: true,
        provider_order_id: order.id,
        status: order.status,
        tracking_info: order.tracking_number ? {
          tracking_number: order.tracking_number,
          tracking_url: order.tracking_url || ''
        } : undefined
      }
    } catch (error) {
      return {
        success: false,
        provider_order_id: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async checkFulfillmentStatus(orderId: string): Promise<PODFulfillmentStatus> {
    const order = await this.getOrder(orderId)

    if (!order) {
      throw new Error(`Order ${orderId} not found`)
    }

    return {
      status: order.status,
      tracking_number: order.tracking_number,
      tracking_url: order.tracking_url,
      updated_at: order.updated_at
    }
  }

  async processWebhook(payload: string, signature?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const webhookData = JSON.parse(payload)

      // Handle different Gelato webhook types
      switch (webhookData.event_type || webhookData.type) {
        case 'order.created':
        case 'order.updated':
        case 'order.shipped':
        case 'order.delivered':
          // Handle order events
          break
        case 'product.created':
        case 'product.updated':
          // Handle product events
          break
        default:
          console.warn(`[GelatoProvider] Unknown webhook type: ${webhookData.event_type || webhookData.type}`)
      }

      return { success: true, message: 'Webhook processed successfully' }
    } catch (error) {
      console.error('[GelatoProvider] Failed to process webhook:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Helper methods for data mapping
  private mapGelatoToPODProduct(gelatoProduct: any): PODProduct {
    return {
      id: gelatoProduct.id?.toString() || '',
      name: gelatoProduct.name || gelatoProduct.title || '',
      description: gelatoProduct.description || '',
      thumbnail_url: gelatoProduct.image_url || gelatoProduct.images?.[0]?.url || '',
      price: gelatoProduct.price || gelatoProduct.base_price || 0,
      variants: Array.isArray(gelatoProduct.variants) ? gelatoProduct.variants.map((v: any) => ({
        id: v.id?.toString() || '',
        name: v.name || v.title || '',
        size: v.size || v.attributes?.size,
        color: v.color || v.attributes?.color,
        price: parseFloat(v.price || v.unit_price) || 0,
        currency: v.currency || 'USD',
        image: v.image_url || v.preview_url || '',
        availability: v.available || v.is_available ? 'available' : 'out_of_stock'
      })) : [],
      provider: this.type,
      metadata: {
        gelato_id: gelatoProduct.id,
        template_id: gelatoProduct.template_id,
        product_type: gelatoProduct.product_type
      }
    }
  }

  private mapPODDataToGelato(podData: Partial<PODProductData>): any {
    return {
      name: podData.name,
      description: podData.description,
      template_id: podData.metadata?.template_id || 'default',
      product_type: podData.metadata?.product_type || 'apparel',
      design_files: podData.image_url ? [{
        url: podData.image_url,
        position: 'front'
      }] : [],
      variants: podData.variants?.map(variant => ({
        size: variant.size,
        color: variant.color,
        price: variant.price,
        enabled: variant.availability === 'available'
      })) || []
    }
  }

  private mapPODOrderToGelato(podOrder: PODOrderData): any {
    return {
      external_id: `medusa_${Date.now()}`,
      items: podOrder.items.map(item => ({
        product_id: item.variant_id.split('_')[0],
        variant_id: item.variant_id.split('_')[1] || item.variant_id,
        quantity: item.quantity,
        unit_price: item.price,
        design_files: item.files?.map(file => ({
          url: file.url,
          type: file.type
        })) || []
      })),
      shipping_address: {
        name: podOrder.recipient.name,
        address_line_1: podOrder.recipient.address1,
        address_line_2: podOrder.recipient.address2 || '',
        city: podOrder.recipient.city,
        state_code: podOrder.recipient.state_code,
        country_code: podOrder.recipient.country_code,
        postal_code: podOrder.recipient.zip,
        phone: podOrder.recipient.phone || '',
        email: podOrder.recipient.email || ''
      },
      shipping_method: 'standard'
    }
  }

  private mapGelatoToPODOrder(gelatoOrder: any): PODOrder {
    return {
      id: gelatoOrder.id?.toString() || '',
      status: gelatoOrder.status || 'pending',
      items: gelatoOrder.items?.map((item: any) => ({
        variant_id: `${item.product_id}_${item.variant_id}`,
        quantity: item.quantity,
        price: item.unit_price || item.total_price || 0,
        files: item.design_files?.map((file: any) => ({
          id: file.id?.toString() || '',
          type: file.type || 'image',
          url: file.url,
          preview_url: file.preview_url
        })) || []
      })) || [],
      shipping: {
        name: gelatoOrder.shipping_address?.name || '',
        address1: gelatoOrder.shipping_address?.address_line_1 || '',
        address2: gelatoOrder.shipping_address?.address_line_2 || '',
        city: gelatoOrder.shipping_address?.city || '',
        state_code: gelatoOrder.shipping_address?.state_code || '',
        country_code: gelatoOrder.shipping_address?.country_code || '',
        zip: gelatoOrder.shipping_address?.postal_code || '',
        phone: gelatoOrder.shipping_address?.phone || '',
        email: gelatoOrder.shipping_address?.email || ''
      },
      total: gelatoOrder.total_cost || gelatoOrder.total_price || 0,
      currency: gelatoOrder.currency || 'USD',
      tracking_number: gelatoOrder.tracking?.tracking_number,
      tracking_url: gelatoOrder.tracking?.tracking_url,
      created_at: gelatoOrder.created_at || new Date().toISOString(),
      updated_at: gelatoOrder.updated_at || new Date().toISOString()
    }
  }

  private convertMedusaOrderToGelato(medusaOrder: any): PODOrderData {
    return {
      recipient: {
        name: `${medusaOrder.shipping_address?.first_name || ''} ${medusaOrder.shipping_address?.last_name || ''}`.trim(),
        address1: medusaOrder.shipping_address?.address_1 || '',
        address2: medusaOrder.shipping_address?.address_2 || '',
        city: medusaOrder.shipping_address?.city || '',
        state_code: medusaOrder.shipping_address?.province || '',
        country_code: medusaOrder.shipping_address?.country_code || '',
        zip: medusaOrder.shipping_address?.postal_code || '',
        phone: medusaOrder.shipping_address?.phone || '',
        email: medusaOrder.email || ''
      },
      items: medusaOrder.items?.map((item: any) => ({
        variant_id: item.variant_id || item.id,
        quantity: item.quantity,
        price: item.unit_price || 0,
        files: [] // Would need to be populated based on artwork associations
      })) || [],
      metadata: {
        medusa_order_id: medusaOrder.id
      }
    }
  }
}