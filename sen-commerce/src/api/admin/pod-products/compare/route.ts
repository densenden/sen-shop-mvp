import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"
import { PODProviderManager } from "../../../../modules/printful/services/pod-provider-facade"

interface ComparisonRequest {
  providers?: string[]
  product_types?: string[]
  variant_criteria?: {
    size?: string
    color?: string
    material?: string
  }
  comparison_type?: 'pricing' | 'availability' | 'features' | 'all'
}

/**
 * POST /api/admin/pod-products/compare
 * Compare products and capabilities across POD providers
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const {
      providers,
      product_types,
      variant_criteria,
      comparison_type = 'all'
    } = req.body as ComparisonRequest

    const podProviderManager: PODProviderManager = req.scope.resolve("printfulModule")

    // Get provider capabilities
    const providerCapabilities = podProviderManager.getProviderCapabilities()
    const enabledProviders = podProviderManager.getEnabledProviders()

    // Filter providers if specified
    const targetProviders = providers?.length
      ? enabledProviders.filter(p => providers.includes(p.type))
      : enabledProviders

    if (targetProviders.length === 0) {
      return res.status(400).json({
        message: "No valid providers specified or available"
      })
    }

    const comparisonResults: any = {
      comparison_id: generateComparisonId(),
      providers_compared: targetProviders.map(p => p.type),
      comparison_type,
      generated_at: new Date().toISOString()
    }

    // Pricing comparison
    if (comparison_type === 'pricing' || comparison_type === 'all') {
      try {
        const pricingComparison = await podProviderManager.compareProductPricing(
          providers || targetProviders.map(p => p.type)
        )
        comparisonResults.pricing_comparison = formatPricingComparison(pricingComparison)

        // Get pricing statistics
        const pricingStats = await podProviderManager.getPricingStatistics(
          providers || targetProviders.map(p => p.type)
        )
        comparisonResults.pricing_statistics = pricingStats
      } catch (error) {
        console.warn("Failed to get pricing comparison:", error)
        comparisonResults.pricing_comparison = { error: "Pricing data unavailable" }
      }
    }

    // Availability comparison
    if (comparison_type === 'availability' || comparison_type === 'all') {
      if (variant_criteria) {
        try {
          const availabilityResults = await podProviderManager.checkVariantAvailability(
            variant_criteria,
            providers || targetProviders.map(p => p.type)
          )
          comparisonResults.availability_comparison = formatAvailabilityComparison(availabilityResults)
        } catch (error) {
          console.warn("Failed to get availability comparison:", error)
          comparisonResults.availability_comparison = { error: "Availability data unavailable" }
        }
      } else {
        comparisonResults.availability_comparison = {
          message: "Specify variant_criteria to check availability"
        }
      }
    }

    // Feature comparison
    if (comparison_type === 'features' || comparison_type === 'all') {
      const featureComparison = buildFeatureComparison(targetProviders, providerCapabilities)
      comparisonResults.feature_comparison = featureComparison

      // Best value recommendations
      if (comparison_type === 'all') {
        try {
          const bestValueProducts = await podProviderManager.findBestValueProducts([
            'products',
            'bulkOperations',
            'mockupGeneration'
          ])
          comparisonResults.recommendations = {
            best_value_products: bestValueProducts.slice(0, 10),
            provider_recommendations: generateProviderRecommendations(
              targetProviders,
              providerCapabilities,
              comparisonResults.pricing_statistics
            )
          }
        } catch (error) {
          console.warn("Failed to generate recommendations:", error)
        }
      }
    }

    // Health status
    const healthStatuses = await podProviderManager.checkAllProvidersHealth()
    comparisonResults.provider_health = Object.fromEntries(
      Object.entries(healthStatuses).filter(([provider]) =>
        targetProviders.some(p => p.type === provider)
      )
    )

    res.json(comparisonResults)

  } catch (error: any) {
    console.error("Error generating provider comparison:", error)
    res.status(500).json({
      message: "Failed to generate provider comparison",
      error: error.message
    })
  }
}

/**
 * GET /api/admin/pod-products/compare/capabilities
 * Get provider capabilities matrix
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const podProviderManager: PODProviderManager = req.scope.resolve("printfulModule")

    const capabilities = podProviderManager.getProviderCapabilities()
    const enabledProviders = podProviderManager.getEnabledProviders()
    const healthStatuses = await podProviderManager.checkAllProvidersHealth()

    // Build capability matrix
    const capabilityMatrix = buildCapabilityMatrix(capabilities)

    // Get rate limit information
    const rateLimits = enabledProviders.reduce((acc, provider) => {
      acc[provider.type] = provider.rateLimitConfig
      return acc
    }, {} as Record<string, any>)

    res.json({
      capabilities: capabilities,
      capability_matrix: capabilityMatrix,
      provider_health: healthStatuses,
      rate_limits: rateLimits,
      enabled_providers: enabledProviders.map(p => ({
        type: p.type,
        name: p.name,
        isEnabled: p.isEnabled
      })),
      generated_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("Error getting provider capabilities:", error)
    res.status(500).json({
      message: "Failed to get provider capabilities",
      error: error.message
    })
  }
}

/**
 * Format pricing comparison results
 */
function formatPricingComparison(pricingData: any[]) {
  return {
    summary: {
      total_products_compared: pricingData.length,
      avg_price_difference: calculateAveragePriceDifference(pricingData),
      most_competitive_provider: findMostCompetitiveProvider(pricingData)
    },
    detailed_comparison: pricingData.slice(0, 20), // Limit to top 20 for response size
    price_ranges: calculatePriceRanges(pricingData)
  }
}

/**
 * Format availability comparison results
 */
function formatAvailabilityComparison(availabilityData: any[]) {
  return {
    summary: {
      total_variants_checked: availabilityData.length,
      fully_available_count: availabilityData.filter(item =>
        Object.values(item.providers).every(available => available)
      ).length,
      partially_available_count: availabilityData.filter(item => {
        const availableProviders = Object.values(item.providers).filter(Boolean)
        return availableProviders.length > 0 && availableProviders.length < Object.keys(item.providers).length
      }).length
    },
    detailed_availability: availabilityData,
    provider_availability_rates: calculateProviderAvailabilityRates(availabilityData)
  }
}

/**
 * Build feature comparison matrix
 */
function buildFeatureComparison(providers: any[], capabilities: Record<string, any>) {
  const features = [
    'products',
    'orders',
    'fulfillment',
    'webhooks',
    'catalogBrowsing',
    'bulkOperations',
    'customSizing',
    'mockupGeneration'
  ]

  return {
    feature_matrix: features.map(feature => ({
      feature,
      providers: providers.reduce((acc, provider) => {
        acc[provider.type] = capabilities[provider.type]?.[feature] || false
        return acc
      }, {})
    })),
    provider_scores: providers.map(provider => ({
      provider: provider.type,
      name: provider.name,
      feature_count: features.filter(feature =>
        capabilities[provider.type]?.[feature]
      ).length,
      feature_percentage: Math.round(
        (features.filter(feature => capabilities[provider.type]?.[feature]).length / features.length) * 100
      )
    }))
  }
}

/**
 * Build capability matrix for all capabilities
 */
function buildCapabilityMatrix(capabilities: Record<string, any>) {
  const allFeatures = new Set<string>()

  // Collect all unique features
  Object.values(capabilities).forEach((providerCaps: any) => {
    Object.keys(providerCaps).forEach(feature => allFeatures.add(feature))
  })

  return Array.from(allFeatures).map(feature => ({
    capability: feature,
    providers: Object.fromEntries(
      Object.entries(capabilities).map(([provider, caps]: [string, any]) => [
        provider,
        caps[feature] || false
      ])
    ),
    availability_percentage: Math.round(
      (Object.values(capabilities).filter((caps: any) => caps[feature]).length /
        Object.keys(capabilities).length) * 100
    )
  }))
}

/**
 * Generate provider recommendations
 */
function generateProviderRecommendations(
  providers: any[],
  capabilities: Record<string, any>,
  pricingStats?: any
) {
  return providers.map(provider => {
    const caps = capabilities[provider.type] || {}
    const pricing = pricingStats?.[provider.type]

    let strengths = []
    let considerations = []

    // Analyze strengths
    if (caps.bulkOperations) strengths.push("Supports bulk operations")
    if (caps.mockupGeneration) strengths.push("Advanced mockup generation")
    if (caps.customSizing) strengths.push("Custom sizing options")
    if (caps.webhooks) strengths.push("Real-time webhook integration")

    // Analyze considerations
    if (!caps.bulkOperations) considerations.push("Limited bulk operation support")
    if (pricing?.averagePrice > 25) considerations.push("Higher average pricing")

    return {
      provider: provider.type,
      name: provider.name,
      recommendation_score: strengths.length * 2 - considerations.length,
      strengths,
      considerations,
      best_for: generateBestForRecommendation(caps),
      pricing_tier: pricing ? categorizePricingTier(pricing.averagePrice) : 'unknown'
    }
  }).sort((a, b) => b.recommendation_score - a.recommendation_score)
}

/**
 * Helper functions
 */
function generateComparisonId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function calculateAveragePriceDifference(pricingData: any[]): number {
  if (pricingData.length === 0) return 0
  const differences = pricingData.map(item => item.priceDifference || 0)
  return Math.round((differences.reduce((sum, diff) => sum + diff, 0) / differences.length) * 100) / 100
}

function findMostCompetitiveProvider(pricingData: any[]): string {
  const providerCounts = pricingData.reduce((acc, item) => {
    if (item.bestValue) {
      acc[item.bestValue] = (acc[item.bestValue] || 0) + 1
    }
    return acc
  }, {})

  return Object.entries(providerCounts).reduce((a, b) =>
    providerCounts[a[0]] > providerCounts[b[0]] ? a : b
  )?.[0] || 'unknown'
}

function calculatePriceRanges(pricingData: any[]) {
  const allPrices = pricingData.flatMap(item =>
    Object.values(item.providers).map((p: any) => p.price).filter(Boolean)
  )

  return {
    min: Math.min(...allPrices),
    max: Math.max(...allPrices),
    average: Math.round((allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length) * 100) / 100
  }
}

function calculateProviderAvailabilityRates(availabilityData: any[]) {
  const providerNames = new Set()
  availabilityData.forEach(item => {
    Object.keys(item.providers).forEach(provider => providerNames.add(provider))
  })

  return Array.from(providerNames).map(provider => ({
    provider,
    availability_rate: Math.round(
      (availabilityData.filter(item => item.providers[provider]).length / availabilityData.length) * 100
    )
  }))
}

function generateBestForRecommendation(capabilities: any): string[] {
  const recommendations = []

  if (capabilities.bulkOperations && capabilities.mockupGeneration) {
    recommendations.push("Large volume operations")
  }
  if (capabilities.customSizing) {
    recommendations.push("Custom fit products")
  }
  if (capabilities.webhooks && capabilities.fulfillment) {
    recommendations.push("Automated fulfillment workflows")
  }
  if (capabilities.catalogBrowsing) {
    recommendations.push("Product discovery and browsing")
  }

  return recommendations.length > 0 ? recommendations : ["General POD needs"]
}

function categorizePricingTier(averagePrice: number): string {
  if (averagePrice < 15) return 'budget'
  if (averagePrice < 25) return 'mid-tier'
  return 'premium'
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]