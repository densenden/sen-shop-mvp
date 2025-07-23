import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// GET /store/check-pricing - Check product pricing status
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Check products with their pricing information
    const productsWithPricing = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "variants.id",
        "variants.title", 
        "variants.prices.id",
        "variants.prices.amount",
        "variants.prices.currency_code"
      ]
    })
    
    res.json({
      success: true,
      products: productsWithPricing
    })
    
  } catch (error) {
    console.error("[Check Pricing] Error:", error)
    res.status(500).json({
      error: "Failed to check pricing",
      message: error.message
    })
  }
}