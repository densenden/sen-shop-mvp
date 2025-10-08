import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { version, templateId } = req.params as { version: string; templateId: string }

    console.log('[template-details-route] GET request received:', { version, templateId })

    const printfulModule = req.scope.resolve("printfulModule")
    const printfulProvider = printfulModule.getProvider("printful")
    const printfulService = printfulProvider.getInternalProductService()

    const templateDetails = await printfulService.fetchTemplateDetails(templateId)

    if (!templateDetails) {
      return res.status(404).json({
        success: false,
        error: "template_not_found",
        message: `Template ${templateId} not found`,
      })
    }

    console.log('[template-details-route] Fetched template details for:', templateId)

    res.json({
      success: true,
      template: templateDetails
    })
  } catch (error: any) {
    console.error("[PrintfulStudio] template details error", error)
    res.status(400).json({
      success: false,
      error: "template_details_failed",
      message: error?.message ?? "Failed to fetch template details",
    })
  }
}
