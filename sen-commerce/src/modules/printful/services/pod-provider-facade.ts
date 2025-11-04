import { MedusaService } from "@medusajs/framework/utils"
import { PrintfulPodProductService } from "./printful-pod-product-service"
import { PrintfulOrderService } from "./printful-order-service"
import { PrintfulFulfillmentService } from "./printful-fulfillment-service"
import { PrintifyProvider } from "../../printify/services/printify-provider"
import { GelatoProvider } from "../../gelato/services/gelato-provider"
import {
  ProviderComparisonUtils,
  ProductPricingComparison,
  VariantAvailabilityResult,
  FeatureCompatibilityMatrix
} from "./provider-comparison-utils"

// Provider capability types
export interface ProviderCapability {
  products: boolean
  orders: boolean
  fulfillment: boolean
  webhooks: boolean
  catalogBrowsing: boolean
  bulkOperations: boolean
  customSizing: boolean
  mockupGeneration: boolean
}

export interface ProviderHealthStatus {
  isHealthy: boolean
  lastChecked: Date
  responseTime?: number
  errorMessage?: string
}

export interface RateLimitConfig {
  requestsPerSecond: number
  burstLimit: number
  cooldownPeriod: number
}

// Generic POD provider interface
export interface PODProvider {
  name: string
  type: string
  isEnabled: boolean
  capabilities: ProviderCapability
  rateLimitConfig: RateLimitConfig

  // Product operations
  fetchProducts(): Promise<PODProduct[]>
  getProduct(productId: string): Promise<PODProduct | null>
  createProduct(productData: PODProductData): Promise<PODProduct>
  updateProduct(productId: string, productData: Partial<PODProductData>): Promise<PODProduct>
  deleteProduct(productId: string): Promise<boolean>

  // Order operations
  createOrder(orderData: PODOrderData): Promise<PODOrder>
  getOrder(orderId: string): Promise<PODOrder | null>
  cancelOrder(orderId: string): Promise<boolean>

  // Fulfillment operations
  processFulfillment(medusaOrder: any): Promise<PODFulfillmentResult>
  checkFulfillmentStatus(orderId: string): Promise<PODFulfillmentStatus>

  // Webhook operations
  processWebhook(payload: string, signature?: string): Promise<{ success: boolean; message?: string }>

  // Health check
  healthCheck(): Promise<ProviderHealthStatus>
}

// Generic POD data interfaces
export interface PODProduct {
  id: string
  name: string
  description?: string
  thumbnail_url: string
  price?: number
  variants?: PODVariant[]
  metadata?: Record<string, any>
  provider?: string
}

export interface PODVariant {
  id: string
  name: string
  size?: string
  color?: string
  price: number
  currency: string
  image?: string
  availability: string
}

export interface PODProductData {
  name: string
  description?: string
  image_url: string
  variants?: PODVariant[]
  artwork_id?: string
  metadata?: Record<string, any>
}

export interface PODOrderData {
  recipient: PODShippingInfo
  items: PODOrderItem[]
  metadata?: Record<string, any>
}

export interface PODOrderItem {
  variant_id: string
  quantity: number
  price: number
  files?: PODFile[]
}

export interface PODFile {
  id: string
  type: string
  url: string
  preview_url?: string
}

export interface PODShippingInfo {
  name: string
  address1: string
  address2?: string
  city: string
  state_code: string
  country_code: string
  zip: string
  phone?: string
  email?: string
}

export interface PODOrder {
  id: string
  status: string
  items: PODOrderItem[]
  shipping: PODShippingInfo
  total: number
  currency: string
  tracking_number?: string
  tracking_url?: string
  created_at: string
  updated_at: string
}

export interface PODFulfillmentResult {
  success: boolean
  provider_order_id: string
  status: string
  tracking_info?: {
    tracking_number: string
    tracking_url: string
  }
  error?: string
}

export interface PODFulfillmentStatus {
  status: string
  tracking_number?: string
  tracking_url?: string
  estimated_delivery?: string
  updated_at: string
}

// Printful provider implementation
export class PrintfulProvider implements PODProvider {
  name = 'Printful'
  type = 'printful'
  isEnabled = true

  capabilities: ProviderCapability = {
    products: true,
    orders: true,
    fulfillment: true,
    webhooks: true,
    catalogBrowsing: true,
    bulkOperations: true,
    customSizing: true,
    mockupGeneration: true
  }

  rateLimitConfig: RateLimitConfig = {
    requestsPerSecond: 5,
    burstLimit: 10,
    cooldownPeriod: 1000
  }

  private productService: PrintfulPodProductService
  private orderService: PrintfulOrderService
  private fulfillmentService: PrintfulFulfillmentService

  constructor(container: any) {
    this.productService = new PrintfulPodProductService(container)
    this.orderService = new PrintfulOrderService(container)
    this.fulfillmentService = new PrintfulFulfillmentService(container)
  }

  getInternalProductService(): PrintfulPodProductService {
    return this.productService;
  }

  async healthCheck(): Promise<ProviderHealthStatus> {
    const startTime = Date.now()
    try {
      // Try to fetch a small amount of data to test connection
      await this.productService.fetchCatalogProducts()
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
    const products = await this.productService.fetchStoreProducts()
    return products.map(product => ({
      ...this.mapPrintfulToPODProduct(product),
      provider: this.type
    }))
  }

  async getProduct(productId: string): Promise<PODProduct | null> {
    const product = await this.productService.getStoreProduct(productId)
    return product ? {
      ...this.mapPrintfulToPODProduct(product),
      provider: this.type
    } : null
  }

  async createProduct(productData: PODProductData): Promise<PODProduct> {
    const printfulData = this.mapPODDataToPrintful(productData)
    const product = await this.productService.createStoreProduct(printfulData)
    return {
      ...this.mapPrintfulToPODProduct(product),
      provider: this.type
    }
  }

  async updateProduct(productId: string, productData: Partial<PODProductData>): Promise<PODProduct> {
    const printfulData = this.mapPODDataToPrintful(productData)
    const product = await this.productService.updateStoreProduct(productId, printfulData)
    return {
      ...this.mapPrintfulToPODProduct(product),
      provider: this.type
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    return await this.productService.deleteStoreProduct(productId)
  }

  async createOrder(orderData: PODOrderData): Promise<PODOrder> {
    const printfulOrderData = this.mapPODOrderToPrintful(orderData)
    const order = await this.orderService.createOrder(printfulOrderData)
    return this.mapPrintfulToPODOrder(order)
  }

  async getOrder(orderId: string): Promise<PODOrder | null> {
    const order = await this.orderService.getOrder(orderId)
    return order ? this.mapPrintfulToPODOrder(order) : null
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    return await this.orderService.cancelOrder(orderId)
  }

  async processFulfillment(medusaOrder: any): Promise<PODFulfillmentResult> {
    const result = await this.fulfillmentService.processFulfillment(medusaOrder)
    return {
      success: result.status !== 'failed',
      provider_order_id: result.printful_order_id,
      status: result.status,
      error: result.workflow_steps.find(step => step.status === 'failed')?.error
    }
  }

  async checkFulfillmentStatus(orderId: string): Promise<PODFulfillmentStatus> {
    const status = await this.fulfillmentService.checkFulfillmentStatus(orderId)
    return {
      status: status.status,
      tracking_number: status.tracking_number,
      tracking_url: status.tracking_url,
      updated_at: status.updated_at
    }
  }

  async processWebhook(payload: string, signature?: string): Promise<{ success: boolean; message?: string }> {
    // This would use the webhook service
    return { success: true, message: 'Webhook processed' }
  }

  // Helper methods to convert between Printful and POD formats
  private mapPrintfulToPODProduct(printfulProduct: any): PODProduct {
    return {
      id: printfulProduct.id,
      name: printfulProduct.name,
      description: printfulProduct.description,
      thumbnail_url: printfulProduct.thumbnail_url,
      price: printfulProduct.variants?.[0]?.price,
      variants: Array.isArray(printfulProduct.variants) ? printfulProduct.variants.map((v: any) => ({
        id: v.id,
        name: v.name,
        price: v.price,
        currency: v.currency,
        availability: 'available'
      })) : []
    }
  }

  private mapPODDataToPrintful(podData: any): any {
    return {
      name: podData.name,
      description: podData.description,
      thumbnail_url: podData.image_url,
      variants: podData.variants
    }
  }

  private mapPODOrderToPrintful(podOrder: PODOrderData): any {
    return {
      recipient: podOrder.recipient,
      items: podOrder.items.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
        files: item.files || []
      }))
    }
  }

  private mapPrintfulToPODOrder(printfulOrder: any): PODOrder {
    return {
      id: printfulOrder.id,
      status: printfulOrder.status,
      items: printfulOrder.items,
      shipping: printfulOrder.shipping,
      total: printfulOrder.total,
      currency: printfulOrder.currency,
      tracking_number: printfulOrder.tracking_number,
      tracking_url: printfulOrder.tracking_url,
      created_at: printfulOrder.created_at,
      updated_at: printfulOrder.updated_at
    }
  }
}

// POD Provider Manager - Main facade class
export class PODProviderManager extends MedusaService({}) {
  private providers: Map<string, PODProvider> = new Map()
  private defaultProvider: string = 'printful'
  private healthStatuses: Map<string, ProviderHealthStatus> = new Map()

  constructor(container: any, options?: any) {
    super(container, options)

    // Initialize providers
    this.providers.set('printful', new PrintfulProvider(container))
    this.providers.set('printify', new PrintifyProvider(container))
    this.providers.set('gelato', new GelatoProvider(container))

    // Set default provider from environment
    this.defaultProvider = process.env.DEFAULT_POD_PROVIDER || 'printful'
  }

  // Get provider by name
  getProvider(providerName?: string): PODProvider {
    const name = providerName || this.defaultProvider
    const provider = this.providers.get(name)

    if (!provider) {
      throw new Error(`POD provider '${name}' not found`)
    }

    if (!provider.isEnabled) {
      throw new Error(`POD provider '${name}' is disabled`)
    }

    return provider
  }

  // Get all providers (including disabled ones)
  getAllProviders(): PODProvider[] {
    return Array.from(this.providers.values())
  }

  // Get all enabled providers
  getEnabledProviders(): PODProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isEnabled)
  }

  // Register a new provider
  registerProvider(name: string, provider: PODProvider): void {
    this.providers.set(name, provider)
  }

  // Enable/disable provider
  setProviderEnabled(name: string, enabled: boolean): void {
    const provider = this.providers.get(name)
    if (provider) {
      provider.isEnabled = enabled
    }
  }

  // Provider capability matrix
  getProviderCapabilities(): Record<string, ProviderCapability> {
    const capabilities: Record<string, ProviderCapability> = {}

    for (const [name, provider] of this.providers) {
      capabilities[name] = provider.capabilities
    }

    return capabilities
  }

  // Health check methods
  async checkProviderHealth(providerName: string): Promise<ProviderHealthStatus> {
    const provider = this.providers.get(providerName)
    if (!provider) {
      throw new Error(`Provider '${providerName}' not found`)
    }

    const healthStatus = await provider.healthCheck()
    this.healthStatuses.set(providerName, healthStatus)
    return healthStatus
  }

  async checkAllProvidersHealth(): Promise<Record<string, ProviderHealthStatus>> {
    const healthStatuses: Record<string, ProviderHealthStatus> = {}

    for (const [name, provider] of this.providers) {
      try {
        const status = await provider.healthCheck()
        healthStatuses[name] = status
        this.healthStatuses.set(name, status)
      } catch (error) {
        const failedStatus: ProviderHealthStatus = {
          isHealthy: false,
          lastChecked: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
        healthStatuses[name] = failedStatus
        this.healthStatuses.set(name, failedStatus)
      }
    }

    return healthStatuses
  }

  getLastHealthStatus(providerName: string): ProviderHealthStatus | null {
    return this.healthStatuses.get(providerName) || null
  }

  // Multi-provider operations
  async fetchProductsFromAllProviders(): Promise<PODProduct[]> {
    const allProducts: PODProduct[] = []
    const enabledProviders = this.getEnabledProviders()

    for (const provider of enabledProviders) {
      try {
        const products = await provider.fetchProducts()
        allProducts.push(...products)
      } catch (error) {
        console.warn(`Failed to fetch products from ${provider.name}:`, error)
      }
    }

    return allProducts
  }

  async fetchProductsFromProviders(providerNames: string[]): Promise<PODProduct[]> {
    const allProducts: PODProduct[] = []

    for (const providerName of providerNames) {
      try {
        const provider = this.getProvider(providerName)
        const products = await provider.fetchProducts()
        allProducts.push(...products)
      } catch (error) {
        console.warn(`Failed to fetch products from ${providerName}:`, error)
      }
    }

    return allProducts
  }

  // Provider comparison utilities
  async compareProductPricing(providerNames?: string[]): Promise<ProductPricingComparison[]> {
    const products = providerNames
      ? await this.fetchProductsFromProviders(providerNames)
      : await this.fetchProductsFromAllProviders()

    return ProviderComparisonUtils.compareProductPricing(products)
  }

  async checkVariantAvailability(
    variantCriteria: { size?: string; color?: string },
    providerNames?: string[]
  ): Promise<VariantAvailabilityResult[]> {
    const products = providerNames
      ? await this.fetchProductsFromProviders(providerNames)
      : await this.fetchProductsFromAllProviders()

    return ProviderComparisonUtils.checkVariantAvailability(products, variantCriteria)
  }

  buildFeatureCompatibilityMatrix(requiredFeatures: (keyof ProviderCapability)[]): FeatureCompatibilityMatrix {
    const capabilities = this.getProviderCapabilities()
    return ProviderComparisonUtils.buildFeatureCompatibilityMatrix(capabilities, requiredFeatures)
  }

  async findBestValueProducts(requiredFeatures: (keyof ProviderCapability)[] = []): Promise<Array<{
    productName: string
    recommendedProvider: string
    reason: string
    price: number
    compatibilityScore: number
  }>> {
    const pricingComparisons = await this.compareProductPricing()
    const featureMatrix = this.buildFeatureCompatibilityMatrix(requiredFeatures)

    return ProviderComparisonUtils.findBestValueProducts(pricingComparisons, featureMatrix)
  }

  async getPricingStatistics(providerNames?: string[]): Promise<{
    [providerName: string]: {
      averagePrice: number
      minPrice: number
      maxPrice: number
      productCount: number
      currency: string
    }
  }> {
    const products = providerNames
      ? await this.fetchProductsFromProviders(providerNames)
      : await this.fetchProductsFromAllProviders()

    return ProviderComparisonUtils.getPricingStatistics(products)
  }

  // Proxy methods to default provider
  async fetchProducts(providerName?: string): Promise<PODProduct[]> {
    return await this.getProvider(providerName).fetchProducts()
  }

  async getProduct(productId: string, providerName?: string): Promise<PODProduct | null> {
    return await this.getProvider(providerName).getProduct(productId)
  }

  async createProduct(productData: PODProductData, providerName?: string): Promise<PODProduct> {
    return await this.getProvider(providerName).createProduct(productData)
  }

  async updateProduct(productId: string, productData: Partial<PODProductData>, providerName?: string): Promise<PODProduct> {
    return await this.getProvider(providerName).updateProduct(productId, productData)
  }

  async deleteProduct(productId: string, providerName?: string): Promise<boolean> {
    return await this.getProvider(providerName).deleteProduct(productId)
  }

  async createOrder(orderData: PODOrderData, providerName?: string): Promise<PODOrder> {
    return await this.getProvider(providerName).createOrder(orderData)
  }

  async getOrder(orderId: string, providerName?: string): Promise<PODOrder | null> {
    return await this.getProvider(providerName).getOrder(orderId)
  }

  async cancelOrder(orderId: string, providerName?: string): Promise<boolean> {
    return await this.getProvider(providerName).cancelOrder(orderId)
  }

  async processFulfillment(medusaOrder: any, providerName?: string): Promise<PODFulfillmentResult> {
    return await this.getProvider(providerName).processFulfillment(medusaOrder)
  }

  async checkFulfillmentStatus(orderId: string, providerName?: string): Promise<PODFulfillmentStatus> {
    return await this.getProvider(providerName).checkFulfillmentStatus(orderId)
  }

  async processWebhook(payload: string, signature?: string, providerName?: string): Promise<{ success: boolean; message?: string }> {
    return await this.getProvider(providerName).processWebhook(payload, signature)
  }

  async fetchCatalogProducts(providerName?: string): Promise<any[]> {
    const provider = this.getProvider(providerName)
    if (provider instanceof PrintfulProvider) {
      return await provider.getInternalProductService().fetchCatalogProducts()
    }
    throw new Error(`Catalog products not supported for provider '${provider.name}'`)
  }

  async listPrintfulProducts(options?: any): Promise<any[]> {
    const provider = this.getProvider('printful')
    if (provider instanceof PrintfulProvider) {
      return await provider.getInternalProductService().listPrintfulProducts(options)
    }
    throw new Error(`listPrintfulProducts is only supported for Printful provider`)
  }
}