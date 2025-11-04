/**
 * POD Provider Facade
 * Manages multiple Print-on-Demand providers through a unified interface
 */

import {
  PODProvider,
  PODProviderType,
  PODProduct,
  PODVariant,
  PODOrder,
  PODProviderHealthStatus,
  PODPricingComparison,
  PODProviderError,
  PODProviderCapabilities,
} from '../../common/types/pod-provider';

export class PODProviderManager {
  private providers: Map<PODProviderType, PODProvider> = new Map();
  private activeProviders: Set<PODProviderType> = new Set();

  /**
   * Register a POD provider
   */
  registerProvider(provider: PODProvider): void {
    this.providers.set(provider.providerType, provider);
    console.log(`Registered POD provider: ${provider.providerType}`);
  }

  /**
   * Get a specific provider
   */
  getProvider(providerType: PODProviderType): PODProvider | undefined {
    return this.providers.get(providerType);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): PODProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get all active providers
   */
  getActiveProviders(): PODProvider[] {
    return Array.from(this.providers.values()).filter(provider =>
      this.activeProviders.has(provider.providerType)
    );
  }

  /**
   * Check health of all providers
   */
  async checkAllProvidersHealth(): Promise<PODProviderHealthStatus[]> {
    const healthChecks = Array.from(this.providers.values()).map(async provider => {
      try {
        const health = await provider.healthCheck();
        if (health.status === 'active') {
          this.activeProviders.add(provider.providerType);
        } else {
          this.activeProviders.delete(provider.providerType);
        }
        return health;
      } catch (error) {
        this.activeProviders.delete(provider.providerType);
        return {
          provider: provider.providerType,
          status: 'error' as const,
          lastChecked: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          capabilities: provider.capabilities,
        };
      }
    });

    return Promise.all(healthChecks);
  }

  /**
   * Get provider capability matrix
   */
  getProviderCapabilityMatrix(): Record<PODProviderType, PODProviderCapabilities> {
    const matrix: Partial<Record<PODProviderType, PODProviderCapabilities>> = {};

    this.providers.forEach((provider, providerType) => {
      matrix[providerType] = provider.capabilities;
    });

    return matrix as Record<PODProviderType, PODProviderCapabilities>;
  }

  /**
   * Get products from all active providers
   */
  async getAllProducts(limit?: number, offset?: number): Promise<PODProduct[]> {
    const activeProviders = this.getActiveProviders();
    const productPromises = activeProviders.map(async provider => {
      try {
        return await provider.getProducts(limit, offset);
      } catch (error) {
        console.error(`Error fetching products from ${provider.providerType}:`, error);
        return [];
      }
    });

    const productArrays = await Promise.all(productPromises);
    return productArrays.flat();
  }

  /**
   * Get products from specific provider
   */
  async getProductsFromProvider(
    providerType: PODProviderType,
    limit?: number,
    offset?: number
  ): Promise<PODProduct[]> {
    const provider = this.getProvider(providerType);
    if (!provider) {
      throw new Error(`Provider ${providerType} not found`);
    }

    return provider.getProducts(limit, offset);
  }

  /**
   * Compare pricing across providers for similar products
   */
  async comparePricing(productName: string): Promise<PODPricingComparison[]> {
    const activeProviders = this.getActiveProviders();
    const comparisons: PODPricingComparison[] = [];

    // Get products from all providers
    const allProducts = await this.getAllProducts();

    // Group similar products by name (simplified logic)
    const similarProducts = allProducts.filter(product =>
      product.name.toLowerCase().includes(productName.toLowerCase())
    );

    // Create comparison for each unique variant combination
    const variantGroups = new Map<string, PODProduct[]>();

    similarProducts.forEach(product => {
      product.variants.forEach(variant => {
        const key = `${variant.size || 'default'}-${variant.color || 'default'}`;
        if (!variantGroups.has(key)) {
          variantGroups.set(key, []);
        }
        variantGroups.get(key)!.push(product);
      });
    });

    variantGroups.forEach((products, variantKey) => {
      const comparison: PODPricingComparison = {
        productId: `comparison-${variantKey}`,
        variantId: variantKey,
        providers: {},
      };

      let bestPrice = Infinity;
      let bestProvider: PODProviderType | undefined;

      products.forEach(product => {
        const variant = product.variants[0]; // Simplified: take first variant
        if (variant) {
          comparison.providers[product.provider] = {
            price: variant.price,
            currency: variant.currency,
            available: variant.availability,
            features: [], // Could be expanded with provider-specific features
          };

          if (variant.price < bestPrice && variant.availability) {
            bestPrice = variant.price;
            bestProvider = product.provider;
          }
        }
      });

      if (bestProvider) {
        comparison.bestValue = bestProvider;
        // Calculate savings compared to most expensive option
        const maxPrice = Math.max(
          ...Object.values(comparison.providers).map(p => p?.price || 0)
        );
        comparison.savings = maxPrice - bestPrice;
      }

      comparisons.push(comparison);
    });

    return comparisons;
  }

  /**
   * Execute bulk operations across providers
   */
  async bulkUpdateProducts(
    updates: Array<{ productId: string; provider: PODProviderType; updates: Partial<PODProduct> }>
  ): Promise<{ success: PODProduct[]; errors: Array<{ productId: string; error: string }> }> {
    const success: PODProduct[] = [];
    const errors: Array<{ productId: string; error: string }> = [];

    // Group updates by provider
    const updatesByProvider = new Map<PODProviderType, typeof updates>();
    updates.forEach(update => {
      if (!updatesByProvider.has(update.provider)) {
        updatesByProvider.set(update.provider, []);
      }
      updatesByProvider.get(update.provider)!.push(update);
    });

    // Execute updates for each provider
    const updatePromises = Array.from(updatesByProvider.entries()).map(
      async ([providerType, providerUpdates]) => {
        const provider = this.getProvider(providerType);
        if (!provider) {
          providerUpdates.forEach(update => {
            errors.push({
              productId: update.productId,
              error: `Provider ${providerType} not found`,
            });
          });
          return;
        }

        try {
          const bulkUpdates = providerUpdates.map(update => ({
            id: update.productId,
            updates: update.updates,
          }));

          const results = await provider.bulkUpdateProducts(bulkUpdates);
          success.push(...results);
        } catch (error) {
          providerUpdates.forEach(update => {
            errors.push({
              productId: update.productId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          });
        }
      }
    );

    await Promise.all(updatePromises);

    return { success, errors };
  }

  /**
   * Check which providers support a specific feature
   */
  getProvidersWithCapability(capability: keyof PODProviderCapabilities): PODProviderType[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.capabilities[capability])
      .map(([providerType]) => providerType);
  }

  /**
   * Get rate limit status for all providers
   */
  getRateLimitStatus(): Record<PODProviderType, { limited: boolean; status?: any }> {
    const status: Partial<Record<PODProviderType, { limited: boolean; status?: any }>> = {};

    this.providers.forEach((provider, providerType) => {
      status[providerType] = {
        limited: provider.isRateLimited(),
        status: provider.getRateLimitStatus(),
      };
    });

    return status as Record<PODProviderType, { limited: boolean; status?: any }>;
  }

  /**
   * Find best provider for a specific operation
   */
  findBestProvider(
    requirements: {
      capability?: keyof PODProviderCapabilities;
      notRateLimited?: boolean;
      preferredProvider?: PODProviderType;
    }
  ): PODProvider | null {
    let candidates = this.getActiveProviders();

    // Filter by capability if specified
    if (requirements.capability) {
      candidates = candidates.filter(provider =>
        provider.capabilities[requirements.capability!]
      );
    }

    // Filter out rate-limited providers if requested
    if (requirements.notRateLimited) {
      candidates = candidates.filter(provider => !provider.isRateLimited());
    }

    // Prefer specific provider if available and meets requirements
    if (requirements.preferredProvider) {
      const preferred = candidates.find(p => p.providerType === requirements.preferredProvider);
      if (preferred) return preferred;
    }

    // Return first available candidate
    return candidates[0] || null;
  }
}

// Singleton instance
export const podProviderManager = new PODProviderManager();