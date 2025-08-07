import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IProductModuleService, IPricingModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({ error: "Product ID is required" })
    }

    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    const pricingService: IPricingModuleService = req.scope.resolve(Modules.PRICING)
    
    // Fetch the product with all necessary relations (try both ID and handle)
    let product = null
    try {
      const [productById] = await productService.listProducts(
        { id },
        {
          relations: ["variants", "images", "tags", "categories", "variants.options"],
          take: 1
        }
      )
      product = productById
    } catch (error) {
      // Try by handle if ID lookup fails
      try {
        const [productByHandle] = await productService.listProducts(
          { handle: id },
          {
            relations: ["variants", "images", "tags", "categories", "variants.options"],
            take: 1
          }
        )
        product = productByHandle
      } catch (handleError) {
        console.error("Failed to find product by ID or handle:", error, handleError)
      }
    }
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }
    
    // Get prices for all variants
    if (product.variants && product.variants.length > 0) {
      for (const variant of product.variants) {
        try {
          // Get price sets for this variant
          const query = req.scope.resolve("query")
          const priceData = await query.graph({
            entity: "product_variant_price_set",
            fields: ["variant_id", "price_set_id"],
            filters: { variant_id: variant.id }
          })
          
          if (priceData?.data?.[0]?.price_set_id) {
            const priceSetId = priceData.data[0].price_set_id
            
            // Get prices from the price set
            const prices = await pricingService.listPrices({
              price_set_id: [priceSetId]
            })
            
            // Add calculated_price for compatibility
            if (prices && prices.length > 0) {
              variant.prices = prices.map(price => ({
                id: price.id,
                amount: price.amount,
                currency_code: price.currency_code,
                min_quantity: price.min_quantity,
                max_quantity: price.max_quantity
              }))
              
              // Set a calculated_price for easier access
              const defaultPrice = prices.find(p => p.currency_code === 'usd') || prices[0]
              variant.calculated_price = {
                amount: defaultPrice.amount,
                currency_code: defaultPrice.currency_code
              }
            }
          }
          
          // Fallback if no prices found
          if (!variant.prices || variant.prices.length === 0) {
            variant.prices = [
              { amount: 2000, currency_code: "usd" }
            ]
            variant.calculated_price = {
              amount: 2000,
              currency_code: "usd"
            }
          }
        } catch (priceError) {
          console.error(`Error fetching prices for variant ${variant.id}:`, priceError)
          // Set default price on error
          variant.prices = [
            { amount: 2000, currency_code: "usd" }
          ]
          variant.calculated_price = {
            amount: 2000,
            currency_code: "usd"
          }
        }
      }
    }
    
    res.json({
      product
    })
    
  } catch (error) {
    console.error("[Store Product] Error fetching product:", error)
    res.status(500).json({ 
      error: "Failed to fetch product",
      message: error.message 
    })
  }
}