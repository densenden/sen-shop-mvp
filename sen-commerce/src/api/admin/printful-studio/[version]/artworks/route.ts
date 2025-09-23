import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { resolvePrintfulStudioService } from "../../service-resolver"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = resolvePrintfulStudioService(req, req.params.version)
    const artworks = await service.listArtworks()
    res.json({ artworks })
  } catch (error: any) {
    console.error("[PrintfulStudio] artworks error", error)
    res.status(400).json({
      error: "artworks_error",
      message: error?.message ?? "Failed to load artworks",
    })
  }
}
