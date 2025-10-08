import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { version } = req.params as { version: string }

    console.log('[templates-route] GET request received:', { version })

    const printfulModule = req.scope.resolve("printfulModule")
    const printfulProvider = printfulModule.getProvider("printful")
    const printfulService = printfulProvider.getInternalProductService()

    const templates = await printfulService.fetchTemplates()

    console.log('[templates-route] Fetched templates:', templates.length)

    res.json({
      success: true,
      templates
    })
  } catch (error: any) {
    console.error("[PrintfulStudio] templates error", error)
    res.status(400).json({
      success: false,
      error: "templates_fetch_failed",
      message: error?.message ?? "Failed to fetch templates",
    })
  }
}
