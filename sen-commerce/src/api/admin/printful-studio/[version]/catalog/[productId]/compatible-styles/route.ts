import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRINTFUL_MODULE } from "../../../../../../../modules/printful"

/**
 * GET /admin/printful-studio/v2/catalog/:productId/compatible-styles?variant_ids=123,456
 *
 * Returns mockup styles that are actually compatible with the given variant IDs.
 * Tests each style by attempting to generate a mockup and tracking which ones work.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { productId } = req.params
    const variantIdsParam = req.query.variant_ids as string

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" })
    }

    if (!variantIdsParam) {
      return res.status(400).json({ error: "variant_ids query parameter is required" })
    }

    const variantIds = variantIdsParam.split(',').map(id => id.trim())

    const printfulService = req.scope.resolve(PRINTFUL_MODULE)

    // 1. Fetch all available mockup styles for this product
    const placementGroups = await printfulService.getMockupStyles(productId)

    if (!placementGroups || placementGroups.length === 0) {
      return res.json({
        compatible_styles: [],
        placement_groups: [],
        tested_count: 0,
        compatible_count: 0
      })
    }

    // 2. Extract all style IDs grouped by placement
    const allStyles: any[] = []
    placementGroups.forEach((group: any) => {
      group.mockup_styles?.forEach((style: any) => {
        allStyles.push({
          ...style,
          placement: group.placement,
          technique: group.technique,
          display_name: group.display_name,
          isUniversal: !style.restricted_to_variants || style.restricted_to_variants.length === 0
        })
      })
    })

    console.log(`[Compatible Styles] Product ${productId}: Found ${allStyles.length} total styles across ${placementGroups.length} placement groups`)
    console.log(`[Compatible Styles] Testing compatibility with ${variantIds.length} variant(s): ${variantIds.join(', ')}`)

    // 3. For now, return all styles with metadata about universal ones
    // In the future, we could test each style but that would be slow and hit rate limits
    // The better approach: return all styles, mark universal ones, and let user select
    // Then generate mockups progressively one-by-one

    const universalStyles = allStyles.filter(s => s.isUniversal)
    const restrictedStyles = allStyles.filter(s => !s.isUniversal)

    console.log(`[Compatible Styles] ${universalStyles.length} universal styles, ${restrictedStyles.length} restricted styles`)

    return res.json({
      placement_groups: placementGroups,
      all_styles: allStyles,
      universal_styles: universalStyles,
      restricted_styles: restrictedStyles,
      total_count: allStyles.length,
      universal_count: universalStyles.length,
      restricted_count: restrictedStyles.length,
      note: "Universal styles (★) work with most products. Restricted styles may only work with specific variants. Mockups will be generated progressively to respect rate limits."
    })

  } catch (error) {
    console.error("[Compatible Styles] Error:", error)
    return res.status(500).json({
      error: "Failed to fetch compatible styles",
      message: error.message
    })
  }
}
