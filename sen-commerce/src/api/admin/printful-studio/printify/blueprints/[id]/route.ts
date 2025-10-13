import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRINTIFY_MODULE } from "../../../../../../modules/printify"

// GET /admin/printful-studio/printify/blueprints/:id - Get blueprint details with variants
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const printifyService = req.scope.resolve(PRINTIFY_MODULE) as any
  const { id } = req.params

  try {
    const [blueprintDetails, providers] = await Promise.all([
      printifyService.getBlueprintDetails(parseInt(id)),
      printifyService.listBlueprintProviders(parseInt(id))
    ])

    // Get variants for the first provider
    const firstProvider = providers?.[0] || providers?.data?.[0]
    let variantsData = []

    if (firstProvider) {
      variantsData = await printifyService.listBlueprintVariants(
        parseInt(id),
        firstProvider.id
      )
    }

    // Extract variants array from response
    const variants = Array.isArray(variantsData) ? variantsData : (variantsData?.variants || variantsData?.data || [])

    // Transform to Printful-compatible format
    const transformedProduct = {
      id: blueprintDetails.id,
      title: blueprintDetails.title,
      description: blueprintDetails.description,
      brand: blueprintDetails.brand,
      model: blueprintDetails.model,
      images: blueprintDetails.images || [],

      // Transform variants to match Printful structure
      variants: variants.map((v: any) => ({
        id: v.id,
        title: v.title,
        size: v.options?.size || v.title,
        color: v.options?.color || '',
        price: v.cost || 0,
        is_available: v.is_enabled !== false
      })),

      // Printify doesn't have product_options like Printful
      product_options: [],

      // Store provider info
      printify_provider_id: firstProvider?.id,
      printify_providers: providers?.data || providers || []
    }

    res.json({
      product: transformedProduct,
      variants,
      providers: providers?.data || providers || []
    })
  } catch (error) {
    console.error(`[Printify API] Error fetching blueprint ${id}:`, error)
    res.status(500).json({ error: error.message })
  }
}
