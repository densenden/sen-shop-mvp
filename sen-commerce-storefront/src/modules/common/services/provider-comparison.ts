/**
 * Provider Comparison Utilities
 * Utilities for comparing POD providers and their offerings
 */

import {
  PODProvider,
  PODProviderType,
  PODProduct,
  PODVariant,
  PODPricingComparison,
  PODProviderCapabilities,
} from '../types/pod-provider';

export interface VariantAvailabilityResult {
  variantKey: string; // size-color combination
  providers: {
    [K in PODProviderType]?: {
      available: boolean;
      variantId: string;
      price: number;
      currency: string;
      deliveryTime?: string;
    };
  };
  totalAvailable: number;
  bestPrice?: {
    provider: PODProviderType;
    price: number;
    currency: string;
  };
}

export interface FeatureCompatibilityMatrix {
  feature: keyof PODProviderCapabilities;
  providers: {
    [K in PODProviderType]?: {
      supported: boolean;
      limitations?: string;
      maxValue?: number;
    };
  };
}

export class ProviderComparisonService {
  /**
   * Compare pricing across providers for similar products
   */
  static async comparePricing(
    providers: PODProvider[],
    productName: string,
    filters?: {
      size?: string;
      color?: string;
      maxPrice?: number;
      currency?: string;
    }
  ): Promise<PODPricingComparison[]> {
    const comparisons: PODPricingComparison[] = [];

    // Get products from all providers
    const allProductPromises = providers.map(async provider => {
      try {
        const products = await provider.getProducts(100, 0); // Get more products for better comparison
        return products.filter(product =>
          product.name.toLowerCase().includes(productName.toLowerCase())
        );
      } catch (error) {
        console.error(`Error fetching products from ${provider.providerType}:`, error);
        return [];
      }
    });

    const providerProducts = await Promise.all(allProductPromises);
    const allProducts = providerProducts.flat();

    // Group variants by size-color combination
    const variantGroups = new Map<string, Array<{ product: PODProduct; variant: PODVariant }>>();

    allProducts.forEach(product => {
      product.variants.forEach(variant => {
        // Apply filters
        if (filters?.size && variant.size !== filters.size) return;
        if (filters?.color && variant.color !== filters.color) return;
        if (filters?.maxPrice && variant.price > filters.maxPrice) return;
        if (filters?.currency && variant.currency !== filters.currency) return;

        const key = `${variant.size || 'default'}-${variant.color || 'default'}`;
        if (!variantGroups.has(key)) {
          variantGroups.set(key, []);
        }
        variantGroups.get(key)!.push({ product, variant });
      });
    });

    // Create comparisons for each variant group
    variantGroups.forEach((items, variantKey) => {
      const comparison: PODPricingComparison = {
        productId: `comparison-${productName.replace(/\s+/g, '-').toLowerCase()}`,
        variantId: variantKey,
        providers: {},
      };

      let bestPrice = Infinity;
      let bestProvider: PODProviderType | undefined;
      let maxPrice = 0;

      // Add each provider's offering for this variant
      items.forEach(({ product, variant }) => {
        const providerType = product.provider;

        // If multiple products from same provider, choose the best price
        if (!comparison.providers[providerType] || comparison.providers[providerType]!.price > variant.price) {
          comparison.providers[providerType] = {
            price: variant.price,
            currency: variant.currency,
            available: variant.availability,
            features: this.extractProviderFeatures(product, variant),
          };
        }

        // Track best and worst prices
        if (variant.availability && variant.price < bestPrice) {
          bestPrice = variant.price;
          bestProvider = providerType;
        }
        if (variant.price > maxPrice) {
          maxPrice = variant.price;
        }
      });

      // Set best value and savings
      if (bestProvider && maxPrice > bestPrice) {
        comparison.bestValue = bestProvider;
        comparison.savings = maxPrice - bestPrice;
      }

      // Only add if we have data from multiple providers or at least one available option
      if (Object.keys(comparison.providers).length > 0) {
        comparisons.push(comparison);
      }
    });

    return comparisons.sort((a, b) => (b.savings || 0) - (a.savings || 0));
  }

  /**
   * Check variant availability across providers
   */
  static async checkVariantAvailability(
    providers: PODProvider[],
    productType: string,
    variants: Array<{ size?: string; color?: string }>
  ): Promise<VariantAvailabilityResult[]> {
    const results: VariantAvailabilityResult[] = [];

    // Get all products from all providers
    const allProductPromises = providers.map(async provider => {
      try {
        const products = await provider.getProducts(100, 0);
        return products.filter(product =>
          product.name.toLowerCase().includes(productType.toLowerCase()) ||
          product.metadata?.productType === productType
        );
      } catch (error) {
        console.error(`Error fetching products from ${provider.providerType}:`, error);
        return [];
      }
    });

    const providerProducts = await Promise.all(allProductPromises);

    // Check each requested variant
    for (const requestedVariant of variants) {
      const variantKey = `${requestedVariant.size || 'default'}-${requestedVariant.color || 'default'}`;
      const result: VariantAvailabilityResult = {
        variantKey,
        providers: {},
        totalAvailable: 0,
      };

      let bestPrice = Infinity;
      let bestProvider: PODProviderType | undefined;

      // Check each provider
      providerProducts.forEach((products, providerIndex) => {
        const provider = providers[providerIndex];
        const matchingVariants = products.flatMap(product =>
          product.variants.filter(variant =>
            (!requestedVariant.size || variant.size === requestedVariant.size) &&
            (!requestedVariant.color || variant.color === requestedVariant.color)
          ).map(variant => ({ product, variant }))
        );

        if (matchingVariants.length > 0) {
          // Find the best option from this provider
          const bestMatch = matchingVariants.reduce((best, current) =>
            current.variant.availability && current.variant.price < best.variant.price ? current : best
          );

          result.providers[provider.providerType] = {
            available: bestMatch.variant.availability,
            variantId: bestMatch.variant.id,
            price: bestMatch.variant.price,
            currency: bestMatch.variant.currency,
            deliveryTime: bestMatch.product.metadata?.deliveryTime || 'Unknown',
          };

          if (bestMatch.variant.availability) {
            result.totalAvailable++;

            if (bestMatch.variant.price < bestPrice) {
              bestPrice = bestMatch.variant.price;
              bestProvider = provider.providerType;
            }
          }
        }
      });

      if (bestProvider) {
        result.bestPrice = {
          provider: bestProvider,
          price: bestPrice,
          currency: result.providers[bestProvider]?.currency || 'USD',
        };
      }

      results.push(result);
    }

    return results.sort((a, b) => b.totalAvailable - a.totalAvailable);
  }

  /**
   * Build feature compatibility matrix
   */
  static buildFeatureCompatibilityMatrix(providers: PODProvider[]): FeatureCompatibilityMatrix[] {
    const features: Array<keyof PODProviderCapabilities> = [
      'supportsTemplates',
      'supportsBulkOperations',
      'supportsVariantMapping',
      'supportsPriceUpdates',
      'supportsInventorySync',
    ];

    return features.map(feature => {
      const matrix: FeatureCompatibilityMatrix = {
        feature,
        providers: {},
      };

      providers.forEach(provider => {
        const capability = provider.capabilities[feature];

        matrix.providers[provider.providerType] = {
          supported: Boolean(capability),
          limitations: this.getFeatureLimitations(provider, feature),
          maxValue: this.getMaxValue(provider, feature),
        };
      });

      return matrix;
    });
  }

  /**
   * Find the best provider for specific requirements
   */
  static findBestProviderForRequirements(
    providers: PODProvider[],
    requirements: {
      features?: Array<keyof PODProviderCapabilities>;
      maxPrice?: number;
      minRateLimit?: number;
      preferredRegion?: string;
      bulkOperationSize?: number;
    }
  ): Array<{ provider: PODProvider; score: number; reasons: string[] }> {
    const scores = providers.map(provider => {
      let score = 0;
      const reasons: string[] = [];

      // Check required features
      if (requirements.features) {
        const supportedFeatures = requirements.features.filter(feature =>
          provider.capabilities[feature]
        );
        score += (supportedFeatures.length / requirements.features.length) * 40;

        if (supportedFeatures.length === requirements.features.length) {
          reasons.push('Supports all required features');
        } else {
          reasons.push(`Supports ${supportedFeatures.length}/${requirements.features.length} features`);
        }
      }

      // Check rate limit
      if (requirements.minRateLimit) {
        if (provider.capabilities.rateLimitPerMinute >= requirements.minRateLimit) {
          score += 20;
          reasons.push('Meets rate limit requirements');
        } else {
          reasons.push('Rate limit below requirements');
        }
      }

      // Check bulk operation size
      if (requirements.bulkOperationSize) {
        if (provider.capabilities.maxBulkOperationSize >= requirements.bulkOperationSize) {
          score += 20;
          reasons.push('Supports required bulk operation size');
        } else {
          reasons.push('Bulk operation size below requirements');
        }
      }

      // Rate provider availability (if not rate limited)
      if (!provider.isRateLimited()) {
        score += 20;
        reasons.push('Currently available (not rate limited)');
      } else {
        reasons.push('Currently rate limited');
      }

      return { provider, score, reasons };
    });

    return scores.sort((a, b) => b.score - a.score);
  }

  /**
   * Compare delivery times across providers
   */
  static async compareDeliveryTimes(
    providers: PODProvider[],
    destination: string
  ): Promise<Array<{ provider: PODProviderType; estimatedDays: number; cost?: number }>> {
    // This would typically involve calling shipping estimation APIs
    // For now, return mock data based on typical provider characteristics
    const estimates = providers.map(provider => {
      let estimatedDays: number;
      let cost: number;

      switch (provider.providerType) {
        case 'printful':
          estimatedDays = destination.toLowerCase().includes('us') ? 3 : 7;
          cost = destination.toLowerCase().includes('us') ? 4.99 : 12.99;
          break;
        case 'printify':
          estimatedDays = destination.toLowerCase().includes('us') ? 4 : 8;
          cost = destination.toLowerCase().includes('us') ? 3.99 : 9.99;
          break;
        case 'gelato':
          estimatedDays = 2; // Gelato's global network advantage
          cost = destination.toLowerCase().includes('us') ? 5.99 : 8.99;
          break;
        default:
          estimatedDays = 7;
          cost = 10.99;
      }

      return {
        provider: provider.providerType,
        estimatedDays,
        cost,
      };
    });

    return estimates.sort((a, b) => a.estimatedDays - b.estimatedDays);
  }

  /**
   * Extract provider-specific features from product metadata
   */
  private static extractProviderFeatures(product: PODProduct, variant: PODVariant): string[] {
    const features: string[] = [];

    switch (product.provider) {
      case 'printful':
        if (variant.metadata?.printfulData?.mockup_url) features.push('High-quality mockups');
        if (product.metadata?.printfulData?.is_discontinued === false) features.push('In stock');
        break;
      case 'printify':
        if (product.metadata?.blueprint_id) features.push('Template-based');
        if (variant.metadata?.sku) features.push('SKU tracking');
        break;
      case 'gelato':
        if (product.metadata?.productionTime) features.push('Fast production');
        if (variant.metadata?.weight) features.push('Lightweight shipping');
        break;
    }

    return features;
  }

  /**
   * Get feature limitations for a provider
   */
  private static getFeatureLimitations(provider: PODProvider, feature: keyof PODProviderCapabilities): string | undefined {
    switch (feature) {
      case 'supportsBulkOperations':
        if (provider.providerType === 'printify') {
          return 'Limited bulk operations, sequential processing required';
        }
        break;
      case 'supportsInventorySync':
        if (provider.providerType === 'printify') {
          return 'Inventory managed by Printify, sync not available';
        }
        break;
    }
    return undefined;
  }

  /**
   * Get maximum value for numeric capabilities
   */
  private static getMaxValue(provider: PODProvider, feature: keyof PODProviderCapabilities): number | undefined {
    switch (feature) {
      case 'supportsBulkOperations':
        return provider.capabilities.maxBulkOperationSize;
      case 'rateLimitPerMinute':
        return provider.capabilities.rateLimitPerMinute;
    }
    return undefined;
  }
}