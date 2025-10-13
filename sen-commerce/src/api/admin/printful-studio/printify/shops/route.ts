import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRINTIFY_MODULE } from "../../../../../modules/printify"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const printifyService = req.scope.resolve(PRINTIFY_MODULE) as any

  try {
    const shops = await printifyService.listShops()
    res.json({ shops })
  } catch (error) {
    console.error("[Printify API] Error fetching shops:", error)
    res.status(500).json({ error: error.message })
  }
}
