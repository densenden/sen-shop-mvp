import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolvePrintfulStudioService } from "../../service-resolver"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = resolvePrintfulStudioService(req, req.params.version)
    const payload = await service.getDashboard()
    res.json(payload)
  } catch (error: any) {
    console.error("[PrintfulStudio] dashboard error", error)
    res.status(400).json({
      error: "dashboard_error",
      message: error?.message ?? "Failed to load dashboard",
    })
  }
}
