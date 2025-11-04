import { PODProviderManager, PrintfulProvider, PODProvider, PODProduct, PODOrderData } from '../pod-provider-facade'

// Mock the dependencies
jest.mock('../printful-pod-product-service')
jest.mock('../printful-order-service')
jest.mock('../printful-fulfillment-service')
jest.mock('../../printify/services/printify-provider')
jest.mock('../../gelato/services/gelato-provider')

// Mock a test provider for testing provider registration
class TestProvider implements PODProvider {
  name = 'Test'
  type = 'test'
  isEnabled = true

  capabilities = {
    products: true,
    orders: true,
    fulfillment: false,
    webhooks: true,
    catalogBrowsing: true,
    bulkOperations: false,
    customSizing: true,
    mockupGeneration: false
  }

  rateLimitConfig = {
    requestsPerSecond: 10,
    burstLimit: 20,
    cooldownPeriod: 500
  }

  async healthCheck() {
    return {
      isHealthy: true,
      lastChecked: new Date(),
      responseTime: 100
    }
  }

  async fetchProducts(): Promise<PODProduct[]> {
    return [
      {
        id: 'test-1',
        name: 'Test Product',
        description: 'Test Description',
        thumbnail_url: 'https://example.com/test.jpg',
        price: 25.99,
        variants: [],
        provider: 'test'
      }
    ]
  }

  async getProduct(productId: string): Promise<PODProduct | null> {
    if (productId === 'test-1') {
      return {
        id: 'test-1',
        name: 'Test Product',
        description: 'Test Description',
        thumbnail_url: 'https://example.com/test.jpg',
        price: 25.99,
        variants: [],
        provider: 'test'
      }
    }
    return null
  }

  async createProduct(): Promise<PODProduct> {
    throw new Error('Not implemented')
  }

  async updateProduct(): Promise<PODProduct> {
    throw new Error('Not implemented')
  }

  async deleteProduct(): Promise<boolean> {
    return false
  }

  async createOrder(): Promise<any> {
    throw new Error('Not implemented')
  }

  async getOrder(): Promise<any> {
    return null
  }

  async cancelOrder(): Promise<boolean> {
    return false
  }

  async processFulfillment(): Promise<any> {
    throw new Error('Not implemented')
  }

  async checkFulfillmentStatus(): Promise<any> {
    throw new Error('Not implemented')
  }

  async processWebhook(): Promise<{ success: boolean; message?: string }> {
    return { success: true }
  }
}

describe('PODProviderManager', () => {
  let manager: PODProviderManager
  const mockContainer = {}

  beforeEach(() => {
    manager = new PODProviderManager(mockContainer)
  })

  describe('Provider Registration and Retrieval', () => {
    test('should register and retrieve a custom provider', () => {
      const testProvider = new TestProvider()

      manager.registerProvider('test', testProvider)
      const retrievedProvider = manager.getProvider('test')

      expect(retrievedProvider).toBe(testProvider)
      expect(retrievedProvider.name).toBe('Test')
      expect(retrievedProvider.type).toBe('test')
    })

    test('should return default provider when no provider name specified', () => {
      const defaultProvider = manager.getProvider()

      expect(defaultProvider).toBeDefined()
      expect(defaultProvider.type).toBe('printful')
    })

    test('should throw error for non-existent provider', () => {
      expect(() => {
        manager.getProvider('non-existent')
      }).toThrow("POD provider 'non-existent' not found")
    })

    test('should throw error for disabled provider', () => {
      const testProvider = new TestProvider()
      testProvider.isEnabled = false

      manager.registerProvider('disabled', testProvider)

      expect(() => {
        manager.getProvider('disabled')
      }).toThrow("POD provider 'disabled' is disabled")
    })
  })

  describe('Provider Management', () => {
    test('should list only enabled providers', () => {
      const enabledProvider = new TestProvider()
      const disabledProvider = new TestProvider()
      disabledProvider.isEnabled = false

      manager.registerProvider('enabled', enabledProvider)
      manager.registerProvider('disabled', disabledProvider)

      const enabledProviders = manager.getEnabledProviders()

      // Should include printful, printify, gelato (from constructor) + our enabled test provider
      expect(enabledProviders.length).toBeGreaterThanOrEqual(1)
      expect(enabledProviders.some(p => p.type === 'enabled')).toBe(true)
      expect(enabledProviders.some(p => p.type === 'disabled')).toBe(false)
    })

    test('should enable and disable providers', () => {
      const testProvider = new TestProvider()
      manager.registerProvider('test', testProvider)

      // Initially enabled
      expect(manager.getProvider('test').isEnabled).toBe(true)

      // Disable
      manager.setProviderEnabled('test', false)
      expect(() => manager.getProvider('test')).toThrow()

      // Re-enable
      manager.setProviderEnabled('test', true)
      expect(manager.getProvider('test').isEnabled).toBe(true)
    })
  })

  describe('Common Interface Method Mapping', () => {
    test('should proxy product fetch to correct provider', async () => {
      const testProvider = new TestProvider()
      const mockFetchProducts = jest.spyOn(testProvider, 'fetchProducts')

      manager.registerProvider('test', testProvider)

      await manager.fetchProducts('test')

      expect(mockFetchProducts).toHaveBeenCalled()
    })

    test('should proxy product retrieval to correct provider', async () => {
      const testProvider = new TestProvider()
      const mockGetProduct = jest.spyOn(testProvider, 'getProduct')

      manager.registerProvider('test', testProvider)

      const result = await manager.getProduct('test-1', 'test')

      expect(mockGetProduct).toHaveBeenCalledWith('test-1')
      expect(result?.id).toBe('test-1')
    })
  })

  describe('Error Handling and Fallbacks', () => {
    test('should handle provider method failures gracefully', async () => {
      const failingProvider = new TestProvider()
      failingProvider.fetchProducts = jest.fn().mockRejectedValue(new Error('API Error'))

      manager.registerProvider('failing', failingProvider)

      await expect(manager.fetchProducts('failing')).rejects.toThrow('API Error')
    })

    test('should fallback to default provider when none specified', async () => {
      const printfulProvider = manager.getProvider('printful')
      const mockFetchProducts = jest.spyOn(printfulProvider, 'fetchProducts').mockResolvedValue([])

      await manager.fetchProducts()

      expect(mockFetchProducts).toHaveBeenCalled()
    })
  })

  describe('Provider Health Check Functionality', () => {
    test('should check if provider is healthy', async () => {
      const testProvider = new TestProvider()
      manager.registerProvider('test', testProvider)

      const healthStatus = await manager.checkProviderHealth('test')

      expect(healthStatus.isHealthy).toBe(true)
      expect(healthStatus.responseTime).toBe(100)
    })

    test('should identify unhealthy providers', async () => {
      const unhealthyProvider = new TestProvider()
      unhealthyProvider.healthCheck = jest.fn().mockResolvedValue({
        isHealthy: false,
        lastChecked: new Date(),
        errorMessage: 'Service unavailable'
      })

      manager.registerProvider('unhealthy', unhealthyProvider)

      const healthStatus = await manager.checkProviderHealth('unhealthy')

      expect(healthStatus.isHealthy).toBe(false)
      expect(healthStatus.errorMessage).toBe('Service unavailable')
    })

    test('should check all providers health', async () => {
      const testProvider = new TestProvider()
      manager.registerProvider('test', testProvider)

      const allHealthStatuses = await manager.checkAllProvidersHealth()

      expect(Object.keys(allHealthStatuses)).toContain('test')
      expect(Object.keys(allHealthStatuses)).toContain('printful')
      expect(Object.keys(allHealthStatuses)).toContain('printify')
      expect(Object.keys(allHealthStatuses)).toContain('gelato')
    })
  })

  describe('Provider Capabilities and Comparison', () => {
    test('should return provider capabilities matrix', () => {
      const testProvider = new TestProvider()
      manager.registerProvider('test', testProvider)

      const capabilities = manager.getProviderCapabilities()

      expect(capabilities.test).toEqual(testProvider.capabilities)
      expect(capabilities.printful).toBeDefined()
      expect(capabilities.printify).toBeDefined()
      expect(capabilities.gelato).toBeDefined()
    })

    test('should build feature compatibility matrix', () => {
      const testProvider = new TestProvider()
      manager.registerProvider('test', testProvider)

      const requiredFeatures = ['products', 'orders', 'fulfillment']
      const matrix = manager.buildFeatureCompatibilityMatrix(requiredFeatures)

      expect(matrix.test).toBeDefined()
      expect(matrix.test.compatibilityScore).toBeGreaterThan(0)
      expect(matrix.test.missingFeatures).toContain('fulfillment') // test provider has fulfillment: false
    })
  })
})