import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GelatoPodService } from "../../../../../modules/gelato/services/gelato-pod-service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const gelatoService = new GelatoPodService(req.scope)
    const stores = await gelatoService.listStores()

    res.json({ stores, total: stores.length })
  } catch (error: any) {
    console.error("[gelato-stores] Error fetching stores:", error)
    res.status(500).json({ error: error.message })
  }
}
