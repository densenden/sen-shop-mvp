import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GelatoPodService } from "../../../../../modules/gelato/services/gelato-pod-service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const gelatoService = new GelatoPodService(req.scope)
    const { catalogUid = "default" } = req.query

    const products = await gelatoService.searchCatalogProducts(catalogUid as string)

    res.json({ products, total: products.length })
  } catch (error: any) {
    console.error("[gelato-catalog] Error fetching catalog:", error)
    res.status(500).json({ error: error.message })
  }
}
