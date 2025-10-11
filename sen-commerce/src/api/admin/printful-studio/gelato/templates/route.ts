import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { GelatoPodService } from "../../../../../modules/gelato/services/gelato-pod-service"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const gelatoService = new GelatoPodService(req.scope)
    const rawProducts = await gelatoService.fetchProductTemplates()

    // Normalize Gelato products to match expected format
    const products = rawProducts.map((p: any) => ({
      id: p.id,
      name: p.title, // Map title -> name
      title: p.title,
      description: p.description,
      thumbnail_url: p.previewUrl, // Map previewUrl -> thumbnail_url
      previewUrl: p.previewUrl,
      variants: p.variants || [],
      // Include all original fields as well
      ...p
    }))

    res.json({ products, total: products.length })
  } catch (error: any) {
    console.error("[gelato-templates] Error fetching templates:", error)
    res.status(500).json({ error: error.message })
  }
}
