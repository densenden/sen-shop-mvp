import { PODProduct, PODVariant, ProviderCapability } from './pod-provider-facade'

export interface ProductPricingComparison {
  productId: string
  productName: string
  providers: {
    [providerName: string]: {
      price: number
      currency: string
      availability: string
      variants: PODVariant[]
    }
  }
  cheapestProvider: string
  priceRange: {
    min: number
    max: number
    currency: string
  }
}

export interface VariantAvailabilityResult {
  variantId: string
  variantName: string
  providers: {
    [providerName: string]: {
      available: boolean
      price: number
      currency: string
    }
  }
  availableProviders: string[]
  unavailableProviders: string[]
}

export interface FeatureCompatibilityMatrix {
  [providerName: string]: {
    capabilities: ProviderCapability
    compatibilityScore: number
    missingFeatures: string[]
  }
}

export class ProviderComparisonUtils {

  /**
   * Compare pricing for similar products across providers
   */
  static compareProductPricing(products: PODProduct[]): ProductPricingComparison[] {
    // Group products by similar name/characteristics
    const productGroups = this.groupSimilarProducts(products)

    return productGroups.map(group => {
      const comparison: ProductPricingComparison = {
        productId: group[0].id,
        productName: group[0].name,
        providers: {},
        cheapestProvider: '',
        priceRange: {
          min: Infinity,
          max: 0,
          currency: 'USD'
        }
      }

      let cheapestPrice = Infinity

      for (const product of group) {
        if (!product.provider || !product.price) continue

        comparison.providers[product.provider] = {
          price: product.price,
          currency: product.variants?.[0]?.currency || 'USD',
          availability: 'available', // Could be enhanced based on actual availability
          variants: product.variants || []
        }

        // Track price range and cheapest provider
        if (product.price < cheapestPrice) {
          cheapestPrice = product.price
          comparison.cheapestProvider = product.provider
        }

        comparison.priceRange.min = Math.min(comparison.priceRange.min, product.price)
        comparison.priceRange.max = Math.max(comparison.priceRange.max, product.price)
      }

      // Handle edge case where no prices were found
      if (comparison.priceRange.min === Infinity) {
        comparison.priceRange.min = 0
      }

      return comparison
    })
  }

  /**
   * Check variant availability across providers
   */
  static checkVariantAvailability(products: PODProduct[], variantCriteria: { size?: string; color?: string }): VariantAvailabilityResult[] {
    const results: VariantAvailabilityResult[] = []

    // Create a map of unique variants based on criteria
    const variantMap = new Map<string, VariantAvailabilityResult>()

    for (const product of products) {
      if (!product.variants || !product.provider) continue

      for (const variant of product.variants) {
        // Check if variant matches criteria
        const matchesCriteria = (
          (!variantCriteria.size || variant.size === variantCriteria.size) &&
          (!variantCriteria.color || variant.color === variantCriteria.color)
        )

        if (!matchesCriteria) continue

        const variantKey = `${variant.size || 'no-size'}_${variant.color || 'no-color'}`

        if (!variantMap.has(variantKey)) {
          variantMap.set(variantKey, {
            variantId: variant.id,
            variantName: variant.name,
            providers: {},
            availableProviders: [],
            unavailableProviders: []
          })
        }

        const variantResult = variantMap.get(variantKey)!
        const isAvailable = variant.availability === 'available'

        variantResult.providers[product.provider] = {
          available: isAvailable,
          price: variant.price,
          currency: variant.currency
        }

        if (isAvailable) {
          if (!variantResult.availableProviders.includes(product.provider)) {
            variantResult.availableProviders.push(product.provider)
          }
        } else {
          if (!variantResult.unavailableProviders.includes(product.provider)) {
            variantResult.unavailableProviders.push(product.provider)
          }
        }
      }
    }

    return Array.from(variantMap.values())
  }

  /**
   * Build feature compatibility matrix
   */
  static buildFeatureCompatibilityMatrix(
    providerCapabilities: Record<string, ProviderCapability>,
    requiredFeatures: (keyof ProviderCapability)[]
  ): FeatureCompatibilityMatrix {
    const matrix: FeatureCompatibilityMatrix = {}

    for (const [providerName, capabilities] of Object.entries(providerCapabilities)) {
      const missingFeatures: string[] = []
      let supportedCount = 0

      for (const feature of requiredFeatures) {
        if (capabilities[feature]) {
          supportedCount++
        } else {
          missingFeatures.push(feature)
        }
      }

      const compatibilityScore = requiredFeatures.length > 0
        ? (supportedCount / requiredFeatures.length) * 100
        : 100

      matrix[providerName] = {
        capabilities,
        compatibilityScore,
        missingFeatures
      }
    }

    return matrix
  }

  /**
   * Find best value products (price vs features)
   */
  static findBestValueProducts(comparisons: ProductPricingComparison[], featureMatrix: FeatureCompatibilityMatrix): Array<{
    productName: string
    recommendedProvider: string
    reason: string
    price: number
    compatibilityScore: number
  }> {
    return comparisons.map(comparison => {
      let bestProvider = comparison.cheapestProvider
      let bestScore = 0
      let reason = 'Cheapest option'

      // Calculate value score (price vs compatibility)
      for (const [providerName, providerData] of Object.entries(comparison.providers)) {
        const featureData = featureMatrix[providerName]
        if (!featureData) continue

        // Simple value calculation: compatibility score divided by relative price
        const relativePrice = providerData.price / comparison.priceRange.min
        const valueScore = featureData.compatibilityScore / relativePrice

        if (valueScore > bestScore) {
          bestScore = valueScore
          bestProvider = providerName
          reason = featureData.compatibilityScore === 100
            ? 'Best value (all features supported)'
            : `Good value (${featureData.compatibilityScore.toFixed(1)}% compatibility)`
        }
      }

      return {
        productName: comparison.productName,
        recommendedProvider: bestProvider,
        reason,
        price: comparison.providers[bestProvider]?.price || 0,
        compatibilityScore: featureMatrix[bestProvider]?.compatibilityScore || 0
      }
    })
  }

  /**
   * Get pricing statistics across providers
   */
  static getPricingStatistics(products: PODProduct[]): {
    [providerName: string]: {
      averagePrice: number
      minPrice: number
      maxPrice: number
      productCount: number
      currency: string
    }
  } {
    const stats: Record<string, any> = {}

    for (const product of products) {
      if (!product.provider || !product.price) continue

      if (!stats[product.provider]) {
        stats[product.provider] = {
          prices: [],
          currency: product.variants?.[0]?.currency || 'USD'
        }
      }

      stats[product.provider].prices.push(product.price)
    }

    // Calculate statistics
    const result: Record<string, any> = {}
    for (const [provider, data] of Object.entries(stats)) {
      const prices = data.prices as number[]
      result[provider] = {
        averagePrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        productCount: prices.length,
        currency: data.currency
      }
    }

    return result
  }

  /**
   * Group similar products based on name similarity
   */
  private static groupSimilarProducts(products: PODProduct[]): PODProduct[][] {
    const groups: PODProduct[][] = []
    const processed = new Set<string>()

    for (const product of products) {
      if (processed.has(product.id)) continue

      const group = [product]
      processed.add(product.id)

      // Find similar products (basic name matching)
      const productWords = this.extractKeywords(product.name)

      for (const otherProduct of products) {
        if (processed.has(otherProduct.id) || otherProduct.id === product.id) continue

        const otherWords = this.extractKeywords(otherProduct.name)
        const similarity = this.calculateSimilarity(productWords, otherWords)

        // If similarity is high enough, group them together
        if (similarity > 0.6) {
          group.push(otherProduct)
          processed.add(otherProduct.id)
        }
      }

      groups.push(group)
    }

    return groups
  }

  /**
   * Extract keywords from product name
   */
  private static extractKeywords(name: string): string[] {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2) // Filter out very short words
  }

  /**
   * Calculate similarity between two sets of keywords
   */
  private static calculateSimilarity(words1: string[], words2: string[]): number {
    const set1 = new Set(words1)
    const set2 = new Set(words2)

    const intersection = new Set([...set1].filter(word => set2.has(word)))
    const union = new Set([...set1, ...set2])

    return union.size > 0 ? intersection.size / union.size : 0
  }
}