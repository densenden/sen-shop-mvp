import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"
import { PODTemplateModuleService } from "../../../modules/pod-template/services/pod-template-service"

interface CreateTemplateRequest {
  name: string
  description?: string
  provider: 'printful' | 'printify' | 'gelato'
  variant_configs: Record<string, any>
  pricing_rules: Record<string, any>
  metadata?: Record<string, any>
  status?: 'draft' | 'active' | 'archived'
}

interface UpdateTemplateRequest {
  name?: string
  description?: string
  variant_configs?: Record<string, any>
  pricing_rules?: Record<string, any>
  metadata?: Record<string, any>
  status?: 'draft' | 'active' | 'archived'
}

interface TemplateQueryParams {
  provider?: string
  status?: string
  q?: string
  limit?: string
  offset?: string
  sort?: string
  order?: 'asc' | 'desc'
}

/**
 * GET /api/admin/pod-templates
 * List POD templates with filtering and search
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const {
      provider,
      status,
      q,
      limit = '20',
      offset = '0',
      sort = 'name',
      order = 'asc'
    } = req.query as TemplateQueryParams

    const templateService: PODTemplateModuleService = req.scope.resolve("podTemplateModuleService")

    // Build filters
    const filters: any = {}
    if (provider) {
      filters.provider = provider
    }
    if (status) {
      filters.status = status
    }

    // Get templates with basic filtering
    let templates = await templateService.listPODTemplates(filters, {
      order: { [sort]: order.toUpperCase() },
      skip: parseInt(offset),
      take: parseInt(limit)
    })

    // Apply search filter if provided
    if (q) {
      templates = await templateService.searchTemplates(q, provider)
      // Re-apply pagination after search
      const limitNum = parseInt(limit)
      const offsetNum = parseInt(offset)
      templates = templates.slice(offsetNum, offsetNum + limitNum)
    }

    // Get usage statistics for each template
    const templatesWithStats = await Promise.all(
      templates.map(async (template) => {
        const productLinks = await templateService.getProductsFromTemplate(template.id)
        const versionHistory = await templateService.getTemplateVersionHistory(template.id)

        return {
          ...template,
          usage_stats: {
            products_created: productLinks.length,
            version_count: versionHistory.length,
            last_used: productLinks[0]?.applied_at || null
          }
        }
      })
    )

    res.json({
      templates: templatesWithStats,
      count: templatesWithStats.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    })

  } catch (error: any) {
    console.error("Error fetching templates:", error)
    res.status(500).json({
      message: "Failed to fetch templates",
      error: error.message
    })
  }
}

/**
 * POST /api/admin/pod-templates
 * Create a new POD template
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const templateData = req.body as CreateTemplateRequest

    if (!templateData.name || !templateData.provider) {
      return res.status(400).json({
        message: "Name and provider are required"
      })
    }

    const templateService: PODTemplateModuleService = req.scope.resolve("podTemplateModuleService")

    const template = await templateService.createTemplate(templateData)

    res.status(201).json({
      template,
      message: "Template created successfully"
    })

  } catch (error: any) {
    console.error("Error creating template:", error)
    res.status(500).json({
      message: "Failed to create template",
      error: error.message
    })
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]