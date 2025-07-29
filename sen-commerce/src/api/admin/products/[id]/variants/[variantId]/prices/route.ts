import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, IPricingModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: productId, variantId } = req.params as { id: string; variantId: string }
    
    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingModuleService: IPricingModuleService = req.scope.resolve(Modules.PRICING)
    
    // Get the product and variant
    const product = await productModuleService.retrieveProduct(productId, {
      relations: ['variants']
    })
    
    const variant = product.variants?.find(v => v.id === variantId)
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" })
    }
    
    // Get current prices for the variant
    let prices = []
    if (variant.price_set_id) {
      try {
        const priceSet = await pricingModuleService.retrievePriceSet(variant.price_set_id, {
          relations: ['prices']
        })
        prices = priceSet.prices || []
      } catch (error) {
        console.log("No existing prices found for variant")
      }
    }
    
    res.json({
      product: {
        id: product.id,
        title: product.title
      },
      variant: {
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        price_set_id: variant.price_set_id
      },
      prices
    })
  } catch (error) {
    console.error("Error fetching variant prices:", error)
    res.status(500).json({ error: "Failed to fetch variant prices" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { id: productId, variantId } = req.params as { id: string; variantId: string }
    const { prices } = req.body as { prices: Array<{ amount: number; currency_code: string }> }
    
    const productModuleService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingModuleService: IPricingModuleService = req.scope.resolve(Modules.PRICING)
    
    // Get the product and variant
    const product = await productModuleService.retrieveProduct(productId, {
      relations: ['variants']
    })
    
    const variant = product.variants?.find(v => v.id === variantId)
    if (!variant) {
      return res.status(404).json({ error: "Variant not found" })
    }
    
    if (!variant.price_set_id) {
      return res.status(400).json({ error: "Variant has no price set" })
    }
    
    // Remove existing prices first
    try {
      const existingPriceSet = await pricingModuleService.retrievePriceSet(variant.price_set_id, {
        relations: ['prices']
      })
      
      if (existingPriceSet.prices && existingPriceSet.prices.length > 0) {
        await pricingModuleService.removePrices(existingPriceSet.prices.map(p => p.id))
      }
    } catch (error) {
      console.log("No existing prices to remove")
    }
    
    // Add new prices
    if (prices && prices.length > 0) {
      await pricingModuleService.addPrices({
        priceSetId: variant.price_set_id,
        prices: prices.map(price => ({
          amount: Number(price.amount),
          currency_code: price.currency_code.toLowerCase()
        }))
      })
    }
    
    res.json({
      success: true,
      message: "Variant prices updated successfully",
      variant_id: variantId,
      prices_count: prices.length
    })
  } catch (error) {
    console.error("Error updating variant prices:", error)
    res.status(500).json({ 
      error: "Failed to update variant prices",
      details: error.message 
    })
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]