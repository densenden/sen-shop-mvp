import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"
import { PODTemplateModuleService } from "../../../../modules/pod-template/services/pod-template-service"

interface UpdateTemplateRequest {
  name?: string
  description?: string
  variant_configs?: Record<string, any>
  pricing_rules?: Record<string, any>
  metadata?: Record<string, any>
  status?: 'draft' | 'active' | 'archived'
  change_summary?: string
}

/**
 * GET /api/admin/pod-templates/[id]
 * Get a specific POD template with details
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

    const [template] = await templateService.listPODTemplates({ id: templateId })

    if (!template) {
      return res.status(404).json({
        message: "Template not found"
      })
    }

    // Get additional details
    const [versionHistory, productLinks] = await Promise.all([
      templateService.getTemplateVersionHistory(templateId),
      templateService.getProductsFromTemplate(templateId)
    ])

    res.json({
      template: {
        ...template,
        version_history: versionHistory,
        usage_stats: {
          products_created: productLinks.length,
          version_count: versionHistory.length,
          last_used: productLinks[0]?.applied_at || null,
          product_links: productLinks.slice(0, 10) // Latest 10 products
        }
      }
    })

  } catch (error: any) {
    console.error("Error fetching template:", error)
    res.status(500).json({
      message: "Failed to fetch template",
      error: error.message
    })
  }
}

/**
 * PUT /api/admin/pod-templates/[id]
 * Update a POD template with versioning
 */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  try {
    const templateId = req.params.id
    const updateData = req.body as UpdateTemplateRequest

    if (!templateId) {
      return res.status(400).json({
        message: "Template ID is required"
      })
    }

    const templateService: PODTemplateModuleService = req.scope.resolve("podTemplateModuleService")

    const template = await templateService.updateTemplateWithVersioning(
      templateId,
      updateData,
      updateData.change_summary
    )

    res.json({
      template,
      message: "Template updated successfully"
    })

  } catch (error: any) {
    console.error("Error updating template:", error)

    if (error.message.includes('not found')) {
      return res.status(404).json({
        message: "Template not found",
        error: error.message
      })
    }

    res.status(500).json({
      message: "Failed to update template",
      error: error.message
    })
  }
}

/**
 * DELETE /api/admin/pod-templates/[id]
 * Archive a POD template (soft delete)
 */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const templateId = req.params.id

    if (!templateId) {
      return res.status(400).json({
        message: "Template ID is required"
      })
    }

    const templateService: PODTemplateModuleService = req.scope.resolve("podTemplateModuleService")

    await templateService.archiveTemplate(templateId)

    res.json({
      message: "Template archived successfully"
    })

  } catch (error: any) {
    console.error("Error archiving template:", error)
    res.status(500).json({
      message: "Failed to archive template",
      error: error.message
    })
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]