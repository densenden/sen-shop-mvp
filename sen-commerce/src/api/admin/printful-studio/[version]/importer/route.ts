import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { assertVersion } from "../../service-resolver"
import { importProducts } from "../../../product-sync/route"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const version = assertVersion(req.params.version)
    const { provider = "printful", product_ids = [] } = (req.body || {}) as {
      provider?: string
      product_ids?: string[]
    }

    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({
        error: "import_invalid_payload",
        message: "Provide at least one product id in product_ids",
      })
    }

    const result = await importProducts(req, provider, product_ids, { apiVersion: version })
    res.json({ ...result, api_version: version })
  } catch (error: any) {
    console.error("[PrintfulStudio] importer error", error)
    res.status(400).json({
      error: "import_failed",
      message: error?.message ?? "Import failed",
    })
  }
}
