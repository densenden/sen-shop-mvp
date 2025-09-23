import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolvePrintfulStudioService } from "../../service-resolver"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = resolvePrintfulStudioService(req, req.params.version)
    const health = await service.checkHealth()
    res.json(health)
  } catch (error: any) {
    console.error("[PrintfulStudio] health error", error)
    res.status(400).json({
      error: "health_error",
      message: error?.message ?? "Failed to run health check",
    })
  }
}
