import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IPricingModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// POST /admin/cleanup-prices - Remove hardcoded 20€/1800 prices from database
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pricingService: IPricingModuleService = req.scope.resolve(Modules.PRICING)
    
    console.log("Starting cleanup of hardcoded 20€ (2000 cent) and 18€ (1800 cent) prices...")
    
    // Get all prices
    const allPrices = await pricingService.listPrices({})
    console.log(`Found ${allPrices.length} total prices`)
    
    // Find hardcoded fallback prices (2000 = 20€, 1800 = 18€)
    const hardcodedPrices = allPrices.filter(price => 
      price.amount === 2000 || price.amount === 1800
    )
    
    console.log(`Found ${hardcodedPrices.length} hardcoded fallback prices to remove`)
    
    const deletedPrices = []
    
    // Delete hardcoded prices
    for (const price of hardcodedPrices) {
      try {
        await pricingService.deletePrices([price.id])
        deletedPrices.push({
          id: price.id,
          amount: price.amount,
          currency_code: price.currency_code
        })
        console.log(`Deleted price: ${price.amount} ${price.currency_code} (ID: ${price.id})`)
      } catch (error) {
        console.error(`Error deleting price ${price.id}:`, error.message)
      }
    }
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedPrices.length} hardcoded fallback prices`,
      deleted_prices: deletedPrices,
      total_prices_before: allPrices.length,
      hardcoded_prices_found: hardcodedPrices.length
    })
    
  } catch (error) {
    console.error("[Cleanup Prices] Error:", error)
    res.status(500).json({
      error: "Failed to cleanup prices",
      message: error.message
    })
  }
}