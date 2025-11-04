/**
 * POD Provider Facade Tests
 * Tests for provider registration, retrieval, common interface methods, and error handling
 */

import {
  PODProviderManager,
  podProviderManager,
} from '../../src/modules/printful/services/pod-provider-facade';
import { PrintfulProvider } from '../../src/modules/printful/services/printful-provider';
import { PrintifyProvider } from '../../src/modules/printify/services/printify-provider';
import { GelatoProvider } from '../../src/modules/gelato/services/gelato-provider';
import {
  PODProvider,
  PODProviderType,
  PODProduct,
  PODProviderHealthStatus,
} from '../../src/modules/common/types/pod-provider';

// Mock providers for testing
class MockPrintfulProvider extends PrintfulProvider {
  constructor() {
    super('test-api-key');
  }

  async healthCheck(): Promise<PODProviderHealthStatus> {
    return {
      provider: 'printful',
      status: 'active',
      lastChecked: new Date(),
      responseTime: 150,
      capabilities: this.capabilities,
    };
  }

  async getProducts(limit = 20, offset = 0): Promise<PODProduct[]> {
    return [
      {
        id: 'printful-1',
        externalId: 'ext-printful-1',
        name: 'Printful T-Shirt',
        status: 'published',
        variants: [],
        provider: 'printful',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}

class MockPrintifyProvider extends PrintifyProvider {
  constructor() {
    super('test-api-key', 'test-shop-id');
  }

  async healthCheck(): Promise<PODProviderHealthStatus> {
    return {
      provider: 'printify',
      status: 'active',
      lastChecked: new Date(),
      responseTime: 200,
      capabilities: this.capabilities,
    };
  }

  async getProducts(limit = 20, offset = 0): Promise<PODProduct[]> {
    return [
      {
        id: 'printify-1',
        externalId: 'ext-printify-1',
        name: 'Printify Hoodie',
        status: 'published',
        variants: [],
        provider: 'printify',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}

class MockGelatoProvider extends GelatoProvider {
  constructor() {
    super('test-api-key');
  }

  async healthCheck(): Promise<PODProviderHealthStatus> {
    return {
      provider: 'gelato',
      status: 'active',
      lastChecked: new Date(),
      responseTime: 100,
      capabilities: this.capabilities,
    };
  }

  async getProducts(limit = 20, offset = 0): Promise<PODProduct[]> {
    return [
      {
        id: 'gelato-1',
        externalId: 'ext-gelato-1',
        name: 'Gelato Poster',
        status: 'published',
        variants: [],
        provider: 'gelato',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}

class MockErrorProvider implements PODProvider {
  readonly providerType: PODProviderType = 'printful';
  readonly capabilities = {
    supportsTemplates: false,
    supportsBulkOperations: false,
    supportsVariantMapping: false,
    supportsPriceUpdates: false,
    supportsInventorySync: false,
    maxBulkOperationSize: 0,
    rateLimitPerMinute: 0,
  };

  async healthCheck(): Promise<PODProviderHealthStatus> {
    throw new Error('Provider health check failed');
  }

  async getProducts(): Promise<PODProduct[]> {
    throw new Error('Failed to fetch products');
  }

  async getProduct(): Promise<PODProduct> {
    throw new Error('Failed to fetch product');
  }

  async createProduct(): Promise<PODProduct> {
    throw new Error('Failed to create product');
  }

  async updateProduct(): Promise<PODProduct> {
    throw new Error('Failed to update product');
  }

  async deleteProduct(): Promise<boolean> {
    throw new Error('Failed to delete product');
  }

  async getVariants(): Promise<any[]> {
    throw new Error('Failed to fetch variants');
  }

  async updateVariant(): Promise<any> {
    throw new Error('Failed to update variant');
  }

  async bulkUpdateProducts(): Promise<PODProduct[]> {
    throw new Error('Failed to bulk update products');
  }

  async bulkUpdateVariants(): Promise<any[]> {
    throw new Error('Failed to bulk update variants');
  }

  async createOrder(): Promise<any> {
    throw new Error('Failed to create order');
  }

  async getOrder(): Promise<any> {
    throw new Error('Failed to fetch order');
  }

  async getOrders(): Promise<any[]> {
    throw new Error('Failed to fetch orders');
  }

  async getVariantPricing(): Promise<{ price: number; currency: string }> {
    throw new Error('Failed to fetch variant pricing');
  }

  isRateLimited(): boolean {
    return false;
  }

  getRateLimitStatus(): { remaining: number; resetTime: Date } {
    return { remaining: 0, resetTime: new Date() };
  }
}

describe('POD Provider Facade', () => {
  let providerManager: PODProviderManager;
  let mockPrintfulProvider: MockPrintfulProvider;
  let mockPrintifyProvider: MockPrintifyProvider;
  let mockGelatoProvider: MockGelatoProvider;

  beforeEach(() => {
    providerManager = new PODProviderManager();
    mockPrintfulProvider = new MockPrintfulProvider();
    mockPrintifyProvider = new MockPrintifyProvider();
    mockGelatoProvider = new MockGelatoProvider();
  });

  describe('Provider Registration and Retrieval', () => {
    test('should register and retrieve providers correctly', () => {
      // Register providers
      providerManager.registerProvider(mockPrintfulProvider);
      providerManager.registerProvider(mockPrintifyProvider);
      providerManager.registerProvider(mockGelatoProvider);

      // Test retrieval by type
      expect(providerManager.getProvider('printful')).toBe(mockPrintfulProvider);
      expect(providerManager.getProvider('printify')).toBe(mockPrintifyProvider);
      expect(providerManager.getProvider('gelato')).toBe(mockGelatoProvider);

      // Test getting all providers
      const allProviders = providerManager.getAllProviders();
      expect(allProviders).toHaveLength(3);
      expect(allProviders).toContain(mockPrintfulProvider);
      expect(allProviders).toContain(mockPrintifyProvider);
      expect(allProviders).toContain(mockGelatoProvider);
    });

    test('should return undefined for non-existent provider', () => {
      expect(providerManager.getProvider('printful')).toBeUndefined();
    });

    test('should track active providers after health checks', async () => {
      providerManager.registerProvider(mockPrintfulProvider);
      providerManager.registerProvider(mockPrintifyProvider);

      // Initially no active providers
      expect(providerManager.getActiveProviders()).toHaveLength(0);

      // After health check, providers should be active
      await providerManager.checkAllProvidersHealth();
      expect(providerManager.getActiveProviders()).toHaveLength(2);
    });
  });

  describe('Common Interface Method Mapping', () => {
    beforeEach(() => {
      providerManager.registerProvider(mockPrintfulProvider);
      providerManager.registerProvider(mockPrintifyProvider);
      providerManager.registerProvider(mockGelatoProvider);
    });

    test('should get products from all active providers', async () => {
      // Make providers active by running health check
      await providerManager.checkAllProvidersHealth();

      const allProducts = await providerManager.getAllProducts();

      expect(allProducts).toHaveLength(3);
      expect(allProducts.some(p => p.provider === 'printful')).toBe(true);
      expect(allProducts.some(p => p.provider === 'printify')).toBe(true);
      expect(allProducts.some(p => p.provider === 'gelato')).toBe(true);
    });

    test('should get products from specific provider', async () => {
      const printfulProducts = await providerManager.getProductsFromProvider('printful');
      expect(printfulProducts).toHaveLength(1);
      expect(printfulProducts[0].provider).toBe('printful');
      expect(printfulProducts[0].name).toBe('Printful T-Shirt');
    });

    test('should throw error for non-existent provider', async () => {
      await expect(
        providerManager.getProductsFromProvider('nonexistent' as PODProviderType)
      ).rejects.toThrow('Provider nonexistent not found');
    });

    test('should return provider capability matrix', () => {
      const matrix = providerManager.getProviderCapabilityMatrix();

      expect(matrix.printful).toBeDefined();
      expect(matrix.printify).toBeDefined();
      expect(matrix.gelato).toBeDefined();

      expect(matrix.printful.supportsTemplates).toBe(true);
      expect(matrix.printify.supportsBulkOperations).toBe(false);
      expect(matrix.gelato.maxBulkOperationSize).toBe(200);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should handle provider errors gracefully during health checks', async () => {
      const errorProvider = new MockErrorProvider();
      providerManager.registerProvider(errorProvider);

      const healthResults = await providerManager.checkAllProvidersHealth();

      expect(healthResults).toHaveLength(1);
      expect(healthResults[0].status).toBe('error');
      expect(healthResults[0].errorMessage).toBe('Provider health check failed');
      expect(providerManager.getActiveProviders()).toHaveLength(0);
    });

    test('should handle product fetching errors gracefully', async () => {
      const errorProvider = new MockErrorProvider();
      providerManager.registerProvider(errorProvider);

      // Force the provider to be active for testing
      (providerManager as any).activeProviders.add('printful');

      const products = await providerManager.getAllProducts();

      // Should return empty array for failed provider
      expect(products).toHaveLength(0);
    });

    test('should handle bulk operation errors with partial success', async () => {
      providerManager.registerProvider(mockPrintfulProvider);

      const updates = [
        { productId: 'product-1', provider: 'printful' as PODProviderType, updates: { name: 'Updated Name' } },
        { productId: 'nonexistent', provider: 'printful' as PODProviderType, updates: { name: 'Will Fail' } },
      ];

      // Mock updateProduct to fail for specific product
      jest.spyOn(mockPrintfulProvider, 'updateProduct').mockImplementation(async (id: string) => {
        if (id === 'nonexistent') {
          throw new Error('Product not found');
        }
        return {
          id,
          externalId: `ext-${id}`,
          name: 'Updated Name',
          status: 'published' as const,
          variants: [],
          provider: 'printful' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      const result = await providerManager.bulkUpdateProducts(updates);

      expect(result.success).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].productId).toBe('nonexistent');
    });
  });

  describe('Provider Health Check Functionality', () => {
    test('should perform health checks on all providers', async () => {
      providerManager.registerProvider(mockPrintfulProvider);
      providerManager.registerProvider(mockPrintifyProvider);
      providerManager.registerProvider(mockGelatoProvider);

      const healthResults = await providerManager.checkAllProvidersHealth();

      expect(healthResults).toHaveLength(3);
      expect(healthResults.every(result => result.status === 'active')).toBe(true);
      expect(healthResults.every(result => result.responseTime! > 0)).toBe(true);
    });

    test('should update active providers based on health check results', async () => {
      providerManager.registerProvider(mockPrintfulProvider);
      const errorProvider = new MockErrorProvider();
      errorProvider.providerType = 'printify' as any;
      providerManager.registerProvider(errorProvider);

      await providerManager.checkAllProvidersHealth();

      const activeProviders = providerManager.getActiveProviders();
      expect(activeProviders).toHaveLength(1);
      expect(activeProviders[0].providerType).toBe('printful');
    });

    test('should get rate limit status for all providers', () => {
      providerManager.registerProvider(mockPrintfulProvider);
      providerManager.registerProvider(mockPrintifyProvider);

      const rateLimitStatus = providerManager.getRateLimitStatus();

      expect(rateLimitStatus.printful).toBeDefined();
      expect(rateLimitStatus.printify).toBeDefined();
      expect(rateLimitStatus.printful.limited).toBe(false);
      expect(rateLimitStatus.printify.limited).toBe(false);
    });

    test('should find best provider based on requirements', async () => {
      providerManager.registerProvider(mockPrintfulProvider);
      providerManager.registerProvider(mockPrintifyProvider);
      providerManager.registerProvider(mockGelatoProvider);

      // Make all providers active
      await providerManager.checkAllProvidersHealth();

      const bestProvider = providerManager.findBestProvider({
        capability: 'supportsBulkOperations',
        notRateLimited: true,
      });

      expect(bestProvider).toBeDefined();
      expect(bestProvider!.capabilities.supportsBulkOperations).toBe(true);
    });

    test('should return null when no provider meets requirements', async () => {
      providerManager.registerProvider(mockPrintifyProvider); // doesn't support bulk operations

      await providerManager.checkAllProvidersHealth();

      const bestProvider = providerManager.findBestProvider({
        capability: 'supportsBulkOperations',
      });

      // Printify doesn't support bulk operations in our test setup
      expect(bestProvider).toBeNull();
    });

    test('should prefer specific provider when available', async () => {
      providerManager.registerProvider(mockPrintfulProvider);
      providerManager.registerProvider(mockGelatoProvider);

      await providerManager.checkAllProvidersHealth();

      const bestProvider = providerManager.findBestProvider({
        preferredProvider: 'gelato',
      });

      expect(bestProvider).toBe(mockGelatoProvider);
    });
  });

  describe('Pricing Comparison', () => {
    beforeEach(() => {
      providerManager.registerProvider(mockPrintfulProvider);
      providerManager.registerProvider(mockPrintifyProvider);
      providerManager.registerProvider(mockGelatoProvider);
    });

    test('should compare pricing across providers', async () => {
      // Mock products with different pricing
      jest.spyOn(mockPrintfulProvider, 'getProducts').mockResolvedValue([
        {
          id: 'printful-1',
          externalId: 'ext-1',
          name: 'T-Shirt Design',
          status: 'published',
          variants: [
            {
              id: 'var-1',
              externalId: 'ext-var-1',
              productId: 'printful-1',
              name: 'Large Red',
              size: 'L',
              color: 'Red',
              price: 25.99,
              currency: 'USD',
              availability: true,
            },
          ],
          provider: 'printful',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      jest.spyOn(mockPrintifyProvider, 'getProducts').mockResolvedValue([
        {
          id: 'printify-1',
          externalId: 'ext-1',
          name: 'T-Shirt Design',
          status: 'published',
          variants: [
            {
              id: 'var-2',
              externalId: 'ext-var-2',
              productId: 'printify-1',
              name: 'Large Red',
              size: 'L',
              color: 'Red',
              price: 22.99,
              currency: 'USD',
              availability: true,
            },
          ],
          provider: 'printify',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Make providers active
      await providerManager.checkAllProvidersHealth();

      const comparisons = await providerManager.comparePricing('T-Shirt');

      expect(comparisons).toHaveLength(1);
      expect(comparisons[0].bestValue).toBe('printify');
      expect(comparisons[0].savings).toBe(3.00);
    });
  });

  describe('Provider Capability Queries', () => {
    beforeEach(() => {
      providerManager.registerProvider(mockPrintfulProvider);
      providerManager.registerProvider(mockPrintifyProvider);
      providerManager.registerProvider(mockGelatoProvider);
    });

    test('should get providers with specific capabilities', () => {
      const templatesProviders = providerManager.getProvidersWithCapability('supportsTemplates');
      expect(templatesProviders).toContain('printful');
      expect(templatesProviders).toContain('printify');
      expect(templatesProviders).toContain('gelato');

      const bulkProviders = providerManager.getProvidersWithCapability('supportsBulkOperations');
      expect(bulkProviders).toContain('printful');
      expect(bulkProviders).toContain('gelato');
      // Printify doesn't support bulk operations
      expect(bulkProviders).not.toContain('printify');
    });
  });
});