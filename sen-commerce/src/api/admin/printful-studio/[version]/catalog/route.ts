import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolvePrintfulStudioService } from "../../service-resolver"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = resolvePrintfulStudioService(req, req.params.version)
    const catalog = await service.listCatalog()
    res.json({ catalog })
  } catch (error: any) {
    console.error("[PrintfulStudio] catalog error", error)
    res.status(400).json({
      error: "catalog_error",
      message: error?.message ?? "Failed to load catalog",
    })
  }
}
