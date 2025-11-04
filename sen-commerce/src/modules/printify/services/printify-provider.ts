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
} from "../printful/services/pod-provider-facade"
import PrintifyService from "./printify-service"

export class PrintifyProvider implements PODProvider {
  name = 'Printify'
  type = 'printify'
  isEnabled = true

  capabilities: ProviderCapability = {
    products: true,
    orders: true,
    fulfillment: true,
    webhooks: true,
    catalogBrowsing: true,
    bulkOperations: false, // Printify has limited bulk operations
    customSizing: true,
    mockupGeneration: true
  }

  rateLimitConfig: RateLimitConfig = {
    requestsPerSecond: 3, // More conservative than Printful
    burstLimit: 5,
    cooldownPeriod: 2000
  }

  private printifyService: PrintifyService
  private shopId: string
  private lastRequestTime = 0
  private shopIdInitialized = false

  constructor(container: any) {
    this.printifyService = new PrintifyService(container)
    this.shopId = process.env.PRINTIFY_SHOP_ID || ''

    // Shop ID will be auto-fetched on first use if not configured
    // if (!this.shopId) {
    //   console.warn('[PrintifyProvider] PRINTIFY_SHOP_ID not configured, will auto-fetch from first available shop')
    // }
  }

  // Auto-fetch shop ID from available shops if not configured
  private async ensureShopId(): Promise<void> {
    if (this.shopId || this.shopIdInitialized) {
      return
    }

    try {
      const shops = await this.printifyService.listShops()
      const shopName = process.env.PRINTIFY_SHOP_NAME || 'SenCommerce'

      // Try to find shop by name first
      const matchingShop = shops.find((shop: any) =>
        shop.title?.toLowerCase() === shopName.toLowerCase()
      )

      // Use matching shop or first available shop
      const selectedShop = matchingShop || shops[0]

      if (selectedShop?.id) {
        this.shopId = selectedShop.id.toString()
        console.log(`[PrintifyProvider] Auto-configured shop: ${selectedShop.title} (ID: ${this.shopId})`)
      } else {
        console.warn('[PrintifyProvider] No Printify shops found')
      }
    } catch (error) {
      console.error('[PrintifyProvider] Failed to fetch shop ID:', error)
    } finally {
      this.shopIdInitialized = true
    }
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

      // Try to list shops as a simple health check
      await this.printifyService.listShops()
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
    await this.ensureShopId()

    if (!this.shopId) {
      throw new Error('Printify shop ID not configured')
    }

    await this.enforceRateLimit()

    try {
      const response = await this.printifyService.listProducts(this.shopId)
      const products = response.data || []

      return products.map((product: any) => this.mapPrintifyToPODProduct(product))
    } catch (error) {
      console.error('[PrintifyProvider] Failed to fetch products:', error)
      throw error
    }
  }

  async getProduct(productId: string): Promise<PODProduct | null> {
    await this.ensureShopId()

    if (!this.shopId) {
      throw new Error('Printify shop ID not configured')
    }

    await this.enforceRateLimit()

    try {
      const product = await this.printifyService.getProduct(this.shopId, productId)
      return product ? this.mapPrintifyToPODProduct(product) : null
    } catch (error) {
      console.error(`[PrintifyProvider] Failed to get product ${productId}:`, error)
      return null
    }
  }

  async createProduct(productData: PODProductData): Promise<PODProduct> {
    await this.ensureShopId()

    if (!this.shopId) {
      throw new Error('Printify shop ID not configured')
    }

    await this.enforceRateLimit()

    try {
      const printifyData = this.mapPODDataToPrintify(productData)
      const product = await this.printifyService.createProduct(this.shopId, printifyData)
      return this.mapPrintifyToPODProduct(product)
    } catch (error) {
      console.error('[PrintifyProvider] Failed to create product:', error)
      throw error
    }
  }

  async updateProduct(productId: string, productData: Partial<PODProductData>): Promise<PODProduct> {
    await this.ensureShopId()

    if (!this.shopId) {
      throw new Error('Printify shop ID not configured')
    }

    await this.enforceRateLimit()

    try {
      const printifyData = this.mapPODDataToPrintify(productData)
      const product = await this.printifyService.updateProduct(this.shopId, productId, printifyData)
      return this.mapPrintifyToPODProduct(product)
    } catch (error) {
      console.error(`[PrintifyProvider] Failed to update product ${productId}:`, error)
      throw error
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    await this.ensureShopId()

    if (!this.shopId) {
      throw new Error('Printify shop ID not configured')
    }

    await this.enforceRateLimit()

    try {
      await this.printifyService.deleteProduct(this.shopId, productId)
      return true
    } catch (error) {
      console.error(`[PrintifyProvider] Failed to delete product ${productId}:`, error)
      return false
    }
  }

  async createOrder(orderData: PODOrderData): Promise<PODOrder> {
    await this.ensureShopId()

    if (!this.shopId) {
      throw new Error('Printify shop ID not configured')
    }

    await this.enforceRateLimit()

    try {
      const printifyOrderData = this.mapPODOrderToPrintify(orderData)
      const order = await this.printifyService.submitOrder(this.shopId, printifyOrderData)
      return this.mapPrintifyToPODOrder(order)
    } catch (error) {
      console.error('[PrintifyProvider] Failed to create order:', error)
      throw error
    }
  }

  async getOrder(orderId: string): Promise<PODOrder | null> {
    await this.ensureShopId()

    if (!this.shopId) {
      throw new Error('Printify shop ID not configured')
    }

    await this.enforceRateLimit()

    try {
      const order = await this.printifyService.getOrder(this.shopId, orderId)
      return order ? this.mapPrintifyToPODOrder(order) : null
    } catch (error) {
      console.error(`[PrintifyProvider] Failed to get order ${orderId}:`, error)
      return null
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    await this.ensureShopId()

    if (!this.shopId) {
      throw new Error('Printify shop ID not configured')
    }

    await this.enforceRateLimit()

    try {
      await this.printifyService.cancelOrder(this.shopId, orderId)
      return true
    } catch (error) {
      console.error(`[PrintifyProvider] Failed to cancel order ${orderId}:`, error)
      return false
    }
  }

  async processFulfillment(medusaOrder: any): Promise<PODFulfillmentResult> {
    // Printify doesn't have a direct fulfillment processing API like Printful
    // Orders are automatically processed when submitted
    try {
      // Convert Medusa order to Printify order format and submit
      const orderData = this.convertMedusaOrderToPrintify(medusaOrder)
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
      // Printify webhooks don't use signatures like Printful
      // Parse the payload and handle accordingly
      const webhookData = JSON.parse(payload)

      // Handle different webhook types
      switch (webhookData.type) {
        case 'order.created':
        case 'order.updated':
        case 'order.shipped':
          // Handle order events
          break
        case 'product.created':
        case 'product.updated':
        case 'product.deleted':
          // Handle product events
          break
        default:
          console.warn(`[PrintifyProvider] Unknown webhook type: ${webhookData.type}`)
      }

      return { success: true, message: 'Webhook processed successfully' }
    } catch (error) {
      console.error('[PrintifyProvider] Failed to process webhook:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Helper methods for data mapping
  private mapPrintifyToPODProduct(printifyProduct: any): PODProduct {
    return {
      id: printifyProduct.id?.toString() || '',
      name: printifyProduct.title || '',
      description: printifyProduct.description || '',
      thumbnail_url: printifyProduct.images?.[0]?.src || '',
      price: printifyProduct.variants?.[0]?.price || 0,
      variants: Array.isArray(printifyProduct.variants) ? printifyProduct.variants.map((v: any) => ({
        id: v.id?.toString() || '',
        name: v.title || '',
        size: v.options?.find((opt: any) => opt.name === 'Size')?.value,
        color: v.options?.find((opt: any) => opt.name === 'Color')?.value,
        price: parseFloat(v.price) || 0,
        currency: 'USD', // Printify typically uses USD
        image: v.image?.src || '',
        availability: v.is_available ? 'available' : 'out_of_stock'
      })) : [],
      provider: this.type,
      metadata: {
        printify_id: printifyProduct.id,
        blueprint_id: printifyProduct.blueprint_id,
        print_provider_id: printifyProduct.print_provider_id
      }
    }
  }

  private mapPODDataToPrintify(podData: Partial<PODProductData>): any {
    return {
      title: podData.name,
      description: podData.description,
      blueprint_id: podData.metadata?.blueprint_id,
      print_provider_id: podData.metadata?.print_provider_id,
      variants: podData.variants?.map(variant => ({
        id: variant.id,
        price: variant.price,
        is_enabled: variant.availability === 'available'
      })),
      images: podData.image_url ? [{
        src: podData.image_url,
        position: 'front'
      }] : []
    }
  }

  private mapPODOrderToPrintify(podOrder: PODOrderData): any {
    return {
      external_id: `medusa_${Date.now()}`,
      line_items: podOrder.items.map(item => ({
        product_id: item.variant_id.split('_')[0], // Extract product ID from variant ID
        variant_id: parseInt(item.variant_id.split('_')[1]) || 0, // Extract variant ID
        quantity: item.quantity,
        print_areas: item.files?.map(file => ({
          front: file.url
        })) || []
      })),
      shipping_method: 1, // Standard shipping
      address_to: {
        first_name: podOrder.recipient.name.split(' ')[0] || '',
        last_name: podOrder.recipient.name.split(' ').slice(1).join(' ') || '',
        email: podOrder.recipient.email || '',
        phone: podOrder.recipient.phone || '',
        country: podOrder.recipient.country_code,
        region: podOrder.recipient.state_code,
        address1: podOrder.recipient.address1,
        address2: podOrder.recipient.address2 || '',
        city: podOrder.recipient.city,
        zip: podOrder.recipient.zip
      }
    }
  }

  private mapPrintifyToPODOrder(printifyOrder: any): PODOrder {
    return {
      id: printifyOrder.id?.toString() || '',
      status: printifyOrder.status || 'pending',
      items: printifyOrder.line_items?.map((item: any) => ({
        variant_id: `${item.product_id}_${item.variant_id}`,
        quantity: item.quantity,
        price: item.cost || 0,
        files: []
      })) || [],
      shipping: {
        name: `${printifyOrder.address_to?.first_name || ''} ${printifyOrder.address_to?.last_name || ''}`.trim(),
        address1: printifyOrder.address_to?.address1 || '',
        address2: printifyOrder.address_to?.address2 || '',
        city: printifyOrder.address_to?.city || '',
        state_code: printifyOrder.address_to?.region || '',
        country_code: printifyOrder.address_to?.country || '',
        zip: printifyOrder.address_to?.zip || '',
        phone: printifyOrder.address_to?.phone || '',
        email: printifyOrder.address_to?.email || ''
      },
      total: printifyOrder.total_cost || 0,
      currency: 'USD',
      tracking_number: printifyOrder.shipments?.[0]?.tracking_number,
      tracking_url: printifyOrder.shipments?.[0]?.tracking_url,
      created_at: printifyOrder.created_at || new Date().toISOString(),
      updated_at: printifyOrder.updated_at || new Date().toISOString()
    }
  }

  private convertMedusaOrderToPrintify(medusaOrder: any): PODOrderData {
    // Convert Medusa order format to POD order format
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