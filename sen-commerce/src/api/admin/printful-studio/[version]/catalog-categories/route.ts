import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { version } = req.params as { version: string }

    console.log('[catalog-categories-route] GET request received:', { version })

    const printfulModule = req.scope.resolve("printfulModule")
    const printfulProvider = printfulModule.getProvider("printful")
    const printfulService = printfulProvider.getInternalProductService()

    const categories = await printfulService.fetchCatalogCategories()

    console.log('[catalog-categories-route] Fetched categories:', categories.length)

    res.json({
      success: true,
      categories
    })
  } catch (error: any) {
    console.error("[PrintfulStudio] catalog categories error", error)
    res.status(400).json({
      success: false,
      error: "catalog_categories_failed",
      message: error?.message ?? "Failed to fetch catalog categories",
    })
  }
}
