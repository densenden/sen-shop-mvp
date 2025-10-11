import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PrintfulPodProductService } from "../../../../../modules/printful/services/printful-pod-product-service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const printfulService = new PrintfulPodProductService(req.scope)
    const templates = await printfulService.fetchV1ProductTemplates()

    res.json({ templates, total: templates.length })
  } catch (error: any) {
    console.error("[v1-templates] Error fetching templates:", error)
    res.status(500).json({ error: error.message })
  }
}
