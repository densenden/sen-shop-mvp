import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRINTIFY_MODULE } from "../../../../../modules/printify"

// GET /admin/printful-studio/printify/catalog - List all blueprints
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const printifyService = req.scope.resolve(PRINTIFY_MODULE) as any

  try {
    console.log("[Printify Catalog] Fetching blueprints...")
    const response = await printifyService.listBlueprints()

    // Printify API wraps data in { data: [...] }
    const blueprints = Array.isArray(response) ? response : (response.data || [])
    console.log(`[Printify Catalog] Got ${blueprints.length} blueprints`)

    if (blueprints.length > 0) {
      console.log("[Printify Catalog] Sample:", {
        id: blueprints[0].id,
        title: blueprints[0].title,
        has_images: !!blueprints[0].images,
        image_count: blueprints[0].images?.length
      })
    }

    // Transform to match frontend expectations
    const products = blueprints.map((bp: any) => ({
      id: bp.id,
      title: bp.title,
      description: bp.description,
      brand: bp.brand,
      model: bp.model,
      images: bp.images || [],
      thumbnail_url: bp.images?.[0] || null,
      is_printify: true
    }))

    res.json({ products, count: products.length })
  } catch (error) {
    console.error("[Printify API] Error fetching catalog:", error)
    res.status(500).json({ error: error.message })
  }
}
