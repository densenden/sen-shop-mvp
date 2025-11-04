import { MedusaService } from "@medusajs/framework/utils"
import { PODTemplate, PODTemplateVersion, PODTemplateProductLink } from "../models"

/**
 * PODTemplateModuleService
 * Service for managing POD templates with CRUD operations, versioning, and application logic
 */
export class PODTemplateModuleService extends MedusaService({
  PODTemplate,
  PODTemplateVersion,
  PODTemplateProductLink
}) {

  constructor(container: any, options?: any) {
    super(container, options)
  }

  /**
   * Create a new POD template
   */
  async createTemplate(data: {
    name: string
    description?: string
    provider: 'printful' | 'printify' | 'gelato'
    variant_configs: Record<string, any>
    pricing_rules: Record<string, any>
    metadata?: Record<string, any>
    status?: 'draft' | 'active' | 'archived'
  }) {
    const templateData = {
      ...data,
      version: 1,
      status: data.status || 'draft'
    }

    const template = await this.createPODTemplates(templateData)

    // Create initial version record
    await this.createPODTemplateVersions({
      template_id: template.id,
      version_number: 1,
      changes: templateData,
      change_summary: "Initial template creation"
    })

    return template
  }

  /**
   * Update template with versioning support
   */
  async updateTemplateWithVersioning(
    templateId: string,
    updates: Partial<{
      name: string
      description: string
      variant_configs: Record<string, any>
      pricing_rules: Record<string, any>
      metadata: Record<string, any>
      status: 'draft' | 'active' | 'archived'
    }>,
    changeSummary?: string
  ) {
    // Get current template
    const [currentTemplate] = await this.listPODTemplates({ id: templateId })
    if (!currentTemplate) {
      throw new Error(`Template ${templateId} not found`)
    }

    // Create version record for current state before updating
    await this.createPODTemplateVersions({
      template_id: templateId,
      version_number: currentTemplate.version,
      changes: {
        name: currentTemplate.name,
        description: currentTemplate.description,
        variant_configs: currentTemplate.variant_configs,
        pricing_rules: currentTemplate.pricing_rules,
        metadata: currentTemplate.metadata,
        status: currentTemplate.status
      },
      change_summary: changeSummary || "Template update"
    })

    // Update template with new version number
    const updatedTemplate = await this.updatePODTemplates({
      id: templateId,
      ...updates,
      version: currentTemplate.version + 1
    })

    return updatedTemplate
  }

  /**
   * Get template version history
   */
  async getTemplateVersionHistory(templateId: string) {
    return this.listPODTemplateVersions({
      template_id: templateId
    }, {
      order: { version_number: "ASC" }
    })
  }

  /**
   * Clone a template
   */
  async cloneTemplate(sourceTemplateId: string, newName: string) {
    const [sourceTemplate] = await this.listPODTemplates({ id: sourceTemplateId })
    if (!sourceTemplate) {
      throw new Error(`Source template ${sourceTemplateId} not found`)
    }

    const clonedTemplate = await this.createTemplate({
      name: newName,
      description: sourceTemplate.description,
      provider: sourceTemplate.provider,
      variant_configs: sourceTemplate.variant_configs,
      pricing_rules: sourceTemplate.pricing_rules,
      metadata: {
        ...sourceTemplate.metadata,
        cloned_from: sourceTemplateId,
        cloned_at: new Date().toISOString()
      },
      status: 'draft'
    })

    // Update with cloned_from reference
    await this.updatePODTemplates({
      id: clonedTemplate.id,
      cloned_from: sourceTemplateId
    })

    return clonedTemplate
  }

  /**
   * Apply template to product data
   */
  async applyTemplateToProduct(
    template: any,
    productData: {
      name: string
      artwork_url?: string
      overrides?: {
        variant_configs?: Record<string, any>
        pricing_rules?: Record<string, any>
      }
    }
  ) {
    // Merge template configs with any overrides
    const variantConfigs = {
      ...template.variant_configs,
      ...(productData.overrides?.variant_configs || {})
    }

    const pricingRules = {
      ...template.pricing_rules,
      ...(productData.overrides?.pricing_rules || {})
    }

    // Generate variants based on configuration
    const variants = this.generateVariantsFromConfig(variantConfigs, pricingRules)

    return {
      name: productData.name,
      provider: template.provider,
      template_id: template.id,
      template_version: template.version,
      variants,
      metadata: {
        artwork_url: productData.artwork_url,
        template_applied: template.id,
        applied_at: new Date().toISOString(),
        overrides: productData.overrides
      }
    }
  }

  /**
   * Generate product variants from template configuration
   */
  private generateVariantsFromConfig(
    variantConfigs: any,
    pricingRules: any
  ) {
    const variants = []
    const sizes = variantConfigs.sizes || ['One Size']
    const colors = variantConfigs.colors || ['Default']

    for (const size of sizes) {
      for (const color of colors) {
        const price = this.calculatePrice(pricingRules)

        variants.push({
          size,
          color,
          price,
          currency: 'USD',
          availability: true,
          name: `${size} - ${color}`,
          metadata: {
            template_generated: true,
            base_cost: pricingRules.base_cost,
            markup_percentage: pricingRules.markup_percentage
          }
        })
      }
    }

    return variants
  }

  /**
   * Calculate price based on pricing rules
   */
  calculatePrice(pricingRules: {
    base_cost: number
    markup_percentage: number
    minimum_price?: number
  }): number {
    const markupMultiplier = 1 + (pricingRules.markup_percentage / 100)
    const calculatedPrice = pricingRules.base_cost * markupMultiplier

    // Enforce minimum price if specified
    const finalPrice = pricingRules.minimum_price && calculatedPrice < pricingRules.minimum_price
      ? pricingRules.minimum_price
      : calculatedPrice

    return Math.round(finalPrice * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Calculate price with additional fees
   */
  calculatePriceWithFees(pricingRules: {
    base_cost: number
    markup_percentage: number
    minimum_price?: number
    additional_fees?: {
      processing_fee?: number
      platform_fee_percentage?: number
    }
  }): number {
    let price = this.calculatePrice(pricingRules)

    if (pricingRules.additional_fees) {
      // Add processing fee
      if (pricingRules.additional_fees.processing_fee) {
        price += pricingRules.additional_fees.processing_fee
      }

      // Add platform fee percentage
      if (pricingRules.additional_fees.platform_fee_percentage) {
        const platformFee = price * (pricingRules.additional_fees.platform_fee_percentage / 100)
        price += platformFee
      }
    }

    return Math.round(price * 100) / 100
  }

  /**
   * Link template to product
   */
  async linkTemplateToProduct(
    templateId: string,
    productId: string,
    templateVersion: number,
    overrides?: Record<string, any>
  ) {
    return this.createPODTemplateProductLinks({
      template_id: templateId,
      product_id: productId,
      template_version: templateVersion,
      overrides,
      applied_at: new Date()
    })
  }

  /**
   * Get products created from a template
   */
  async getProductsFromTemplate(templateId: string) {
    return this.listPODTemplateProductLinks({
      template_id: templateId
    }, {
      order: { applied_at: "DESC" }
    })
  }

  /**
   * Get template used for a product
   */
  async getTemplateForProduct(productId: string) {
    const [link] = await this.listPODTemplateProductLinks({
      product_id: productId
    })

    if (!link) {
      return null
    }

    const [template] = await this.listPODTemplates({
      id: link.template_id
    })

    return {
      template,
      link,
      version_used: link.template_version
    }
  }

  /**
   * Get templates by provider
   */
  async getTemplatesByProvider(provider: 'printful' | 'printify' | 'gelato') {
    return this.listPODTemplates({
      provider
    }, {
      order: { updated_at: "DESC" }
    })
  }

  /**
   * Get active templates
   */
  async getActiveTemplates() {
    return this.listPODTemplates({
      status: 'active'
    }, {
      order: { name: "ASC" }
    })
  }

  /**
   * Archive a template (soft delete)
   */
  async archiveTemplate(templateId: string) {
    return this.updatePODTemplates({
      id: templateId,
      status: 'archived'
    })
  }

  /**
   * Search templates by name
   */
  async searchTemplates(searchTerm: string, provider?: string) {
    const filters: any = {}

    if (provider) {
      filters.provider = provider
    }

    // Get all templates and filter by name (simplified search)
    const templates = await this.listPODTemplates(filters)

    return templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }
}