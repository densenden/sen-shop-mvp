import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"
import { PODTemplateModuleService } from "../../../../../modules/pod-template/services/pod-template-service"
import { PODProviderManager } from "../../../../../modules/printful/services/pod-provider-facade"

interface ApplyTemplateRequest {
  product_name: string
  artwork_url?: string
  product_ids?: string[] // For bulk application
  overrides?: {
    variant_configs?: Record<string, any>
    pricing_rules?: Record<string, any>
  }
  create_products?: boolean // If true, create new products; if false, just return preview
}

/**
 * POST /api/admin/pod-templates/[id]/apply
 * Apply template to product data or create new products
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const templateId = req.params.id
    const {
      product_name,
      artwork_url,
      product_ids,
      overrides,
      create_products = false
    } = req.body as ApplyTemplateRequest

    if (!templateId) {
      return res.status(400).json({
        message: "Template ID is required"
      })
    }

    if (!product_name && !product_ids) {
      return res.status(400).json({
        message: "Either product_name or product_ids is required"
      })
    }

    const templateService: PODTemplateModuleService = req.scope.resolve("podTemplateModuleService")
    const podProviderManager: PODProviderManager = req.scope.resolve("printfulModule")

    // Get template
    const [template] = await templateService.listPODTemplates({ id: templateId })

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      })
    }

    if (template.status !== 'active') {
      return res.status(400).json({
        message: "Template must be active to apply"
      })
    }

    let results = []

    if (product_ids && product_ids.length > 0) {
      // Bulk application
      results = await Promise.all(
        product_ids.map(async (productId) => {
          try {
            return await applyTemplateToExistingProduct(
              template,
              productId,
              templateService,
              podProviderManager,
              overrides,
              create_products
            )
          } catch (error: any) {
            return {
              product_id: productId,
              success: false,
              error: error.message
            }
          }
        })
      )
    } else {
      // Single product application
      const productData = {
        name: product_name,
        artwork_url,
        overrides
      }

      const appliedData = await templateService.applyTemplateToProduct(template, productData)

      if (create_products) {
        // Create actual product using POD provider
        try {
          const newProduct = await podProviderManager.createProduct(
            {
              name: appliedData.name,
              description: `Product created from template: ${template.name}`,
              image_url: artwork_url || '',
              variants: appliedData.variants,
              metadata: appliedData.metadata
            },
            template.provider
          )

          // Link template to product
          await templateService.linkTemplateToProduct(
            templateId,
            newProduct.id,
            template.version,
            overrides
          )

          results.push({
            success: true,
            product: newProduct,
            template_data: appliedData
          })
        } catch (error: any) {
          results.push({
            success: false,
            error: error.message,
            preview_data: appliedData
          })
        }
      } else {
        // Return preview only
        results.push({
          success: true,
          preview_data: appliedData,
          estimated_price_range: calculatePriceRange(appliedData.variants)
        })
      }
    }

    res.json({
      template_id: templateId,
      template_name: template.name,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    })

  } catch (error: any) {
    console.error("Error applying template:", error)
    res.status(500).json({
      message: "Failed to apply template",
      error: error.message
    })
  }
}

/**
 * Apply template to existing product
 */
async function applyTemplateToExistingProduct(
  template: any,
  productId: string,
  templateService: PODTemplateModuleService,
  podProviderManager: PODProviderManager,
  overrides?: any,
  updateProduct: boolean = false
) {
  // Get existing product
  const existingProduct = await podProviderManager.getProduct(productId, template.provider)

  if (!existingProduct) {
    throw new Error(`Product ${productId} not found`)
  }

  const productData = {
    name: existingProduct.name,
    artwork_url: existingProduct.metadata?.artwork_url,
    overrides
  }

  const appliedData = await templateService.applyTemplateToProduct(template, productData)

  if (updateProduct) {
    // Update the existing product
    const updatedProduct = await podProviderManager.updateProduct(
      productId,
      {
        variants: appliedData.variants,
        metadata: {
          ...existingProduct.metadata,
          ...appliedData.metadata
        }
      },
      template.provider
    )

    // Link template to product
    await templateService.linkTemplateToProduct(
      template.id,
      productId,
      template.version,
      overrides
    )

    return {
      product_id: productId,
      success: true,
      product: updatedProduct,
      template_data: appliedData
    }
  } else {
    return {
      product_id: productId,
      success: true,
      preview_data: appliedData,
      estimated_price_range: calculatePriceRange(appliedData.variants)
    }
  }
}

/**
 * Calculate price range from variants
 */
function calculatePriceRange(variants: any[]) {
  if (!variants || variants.length === 0) {
    return { min: 0, max: 0, currency: 'USD' }
  }

  const prices = variants.map(v => v.price).filter(p => p !== undefined)

  if (prices.length === 0) {
    return { min: 0, max: 0, currency: 'USD' }
  }

  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
    currency: variants[0].currency || 'USD'
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]