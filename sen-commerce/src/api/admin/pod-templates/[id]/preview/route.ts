import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"
import { PODTemplateModuleService } from "../../../../../modules/pod-template/services/pod-template-service"

interface TemplatePreviewRequest {
  product_name?: string
  artwork_url?: string
  overrides?: {
    variant_configs?: Record<string, any>
    pricing_rules?: Record<string, any>
  }
}

/**
 * POST /api/admin/pod-templates/[id]/preview
 * Generate preview of template application without creating products
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const templateId = req.params.id
    const {
      product_name = 'Preview Product',
      artwork_url,
      overrides
    } = req.body as TemplatePreviewRequest

    if (!templateId) {
      return res.status(400).json({
        message: "Template ID is required"
      })
    }

    const templateService: PODTemplateModuleService = req.scope.resolve("podTemplateModuleService")

    // Get template
    const [template] = await templateService.listPODTemplates({ id: templateId })

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      })
    }

    // Apply template to generate preview data
    const productData = {
      name: product_name,
      artwork_url,
      overrides
    }

    const previewData = await templateService.applyTemplateToProduct(template, productData)

    // Generate pricing analysis
    const pricingAnalysis = analyzePricing(previewData.variants, template.pricing_rules)

    // Generate variant summary
    const variantSummary = summarizeVariants(previewData.variants)

    // Check for potential issues
    const validationIssues = validateTemplateApplication(template, previewData)

    res.json({
      template: {
        id: template.id,
        name: template.name,
        provider: template.provider,
        version: template.version
      },
      preview: {
        product_data: previewData,
        pricing_analysis: pricingAnalysis,
        variant_summary: variantSummary,
        validation_issues: validationIssues,
        estimated_costs: calculateEstimatedCosts(previewData.variants),
        preview_urls: generatePreviewUrls(previewData, artwork_url)
      },
      overrides_applied: overrides || {},
      generated_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error("Error generating template preview:", error)
    res.status(500).json({
      message: "Failed to generate template preview",
      error: error.message
    })
  }
}

/**
 * GET /api/admin/pod-templates/[id]/preview
 * Get basic template preview without product data
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const templateId = req.params.id

    if (!templateId) {
      return res.status(400).json({
        message: "Template ID is required"
      })
    }

    const templateService: PODTemplateModuleService = req.scope.resolve("podTemplateModuleService")

    // Get template
    const [template] = await templateService.listPODTemplates({ id: templateId })

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      })
    }

    // Generate basic preview without specific product data
    const basicPreview = templateService.generateVariantsFromConfig(
      template.variant_configs,
      template.pricing_rules
    )

    const summary = {
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        provider: template.provider,
        version: template.version,
        status: template.status
      },
      configuration: {
        variant_configs: template.variant_configs,
        pricing_rules: template.pricing_rules,
        metadata: template.metadata
      },
      preview_variants: basicPreview,
      summary: {
        total_variants: basicPreview.length,
        price_range: {
          min: Math.min(...basicPreview.map(v => v.price)),
          max: Math.max(...basicPreview.map(v => v.price)),
          currency: basicPreview[0]?.currency || 'USD'
        },
        available_sizes: [...new Set(basicPreview.map(v => v.size))],
        available_colors: [...new Set(basicPreview.map(v => v.color))]
      }
    }

    res.json(summary)

  } catch (error: any) {
    console.error("Error getting template preview:", error)
    res.status(500).json({
      message: "Failed to get template preview",
      error: error.message
    })
  }
}

/**
 * Analyze pricing structure of variants
 */
function analyzePricing(variants: any[], pricingRules: any) {
  const prices = variants.map(v => v.price)
  const baseCost = pricingRules.base_cost || 0
  const markupPercentage = pricingRules.markup_percentage || 0

  return {
    base_cost: baseCost,
    markup_percentage: markupPercentage,
    calculated_markup: prices[0] ? ((prices[0] - baseCost) / baseCost * 100).toFixed(2) : 0,
    price_range: {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: (prices.reduce((sum, p) => sum + p, 0) / prices.length).toFixed(2)
    },
    margin_analysis: {
      gross_margin: baseCost ? (((prices[0] - baseCost) / prices[0]) * 100).toFixed(2) : 0,
      profit_per_unit: prices[0] ? (prices[0] - baseCost).toFixed(2) : 0
    }
  }
}

/**
 * Summarize variant distribution
 */
function summarizeVariants(variants: any[]) {
  const sizeCount = variants.reduce((acc, v) => {
    acc[v.size] = (acc[v.size] || 0) + 1
    return acc
  }, {})

  const colorCount = variants.reduce((acc, v) => {
    acc[v.color] = (acc[v.color] || 0) + 1
    return acc
  }, {})

  return {
    total_variants: variants.length,
    size_distribution: sizeCount,
    color_distribution: colorCount,
    unique_sizes: Object.keys(sizeCount).length,
    unique_colors: Object.keys(colorCount).length
  }
}

/**
 * Validate template application for potential issues
 */
function validateTemplateApplication(template: any, previewData: any) {
  const issues = []

  // Check for missing required fields
  if (!previewData.variants || previewData.variants.length === 0) {
    issues.push({
      type: 'error',
      message: 'No variants generated from template configuration'
    })
  }

  // Check pricing rules
  if (!template.pricing_rules.base_cost || template.pricing_rules.base_cost <= 0) {
    issues.push({
      type: 'warning',
      message: 'Base cost not set or is zero'
    })
  }

  if (!template.pricing_rules.markup_percentage || template.pricing_rules.markup_percentage < 0) {
    issues.push({
      type: 'warning',
      message: 'Markup percentage not set or is negative'
    })
  }

  // Check variant configurations
  if (!template.variant_configs.sizes || template.variant_configs.sizes.length === 0) {
    issues.push({
      type: 'info',
      message: 'No sizes configured, using default'
    })
  }

  if (!template.variant_configs.colors || template.variant_configs.colors.length === 0) {
    issues.push({
      type: 'info',
      message: 'No colors configured, using default'
    })
  }

  return issues
}

/**
 * Calculate estimated costs for production
 */
function calculateEstimatedCosts(variants: any[]) {
  const totalVariants = variants.length
  const averagePrice = variants.reduce((sum, v) => sum + v.price, 0) / totalVariants
  const averageBaseCost = variants.reduce((sum, v) => sum + (v.metadata?.base_cost || 0), 0) / totalVariants

  return {
    per_variant: {
      average_selling_price: averagePrice.toFixed(2),
      average_cost: averageBaseCost.toFixed(2),
      average_profit: (averagePrice - averageBaseCost).toFixed(2)
    },
    bulk_estimates: {
      cost_for_10_units: (averageBaseCost * 10).toFixed(2),
      cost_for_100_units: (averageBaseCost * 100).toFixed(2),
      revenue_for_10_units: (averagePrice * 10).toFixed(2),
      revenue_for_100_units: (averagePrice * 100).toFixed(2)
    }
  }
}

/**
 * Generate preview URLs for mockups
 */
function generatePreviewUrls(previewData: any, artworkUrl?: string) {
  // In a real implementation, this would generate actual mockup URLs
  const baseUrl = 'https://example.com/mockups'

  return {
    primary_mockup: artworkUrl ? `${baseUrl}/primary?artwork=${encodeURIComponent(artworkUrl)}` : null,
    variant_mockups: previewData.variants.slice(0, 3).map((variant: any, index: number) => ({
      variant_name: variant.name,
      mockup_url: `${baseUrl}/variant-${index}?size=${variant.size}&color=${variant.color}`
    })),
    lifestyle_mockups: [
      `${baseUrl}/lifestyle/casual`,
      `${baseUrl}/lifestyle/formal`
    ]
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]