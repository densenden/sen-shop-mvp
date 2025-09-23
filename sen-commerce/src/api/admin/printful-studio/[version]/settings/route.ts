import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolvePrintfulStudioService } from "../../service-resolver"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = resolvePrintfulStudioService(req, req.params.version)
    const settings = await service.getSettingsSummary()
    res.json(settings)
  } catch (error: any) {
    console.error("[PrintfulStudio] settings error", error)
    res.status(400).json({
      error: "settings_error",
      message: error?.message ?? "Failed to load settings",
    })
  }
}
