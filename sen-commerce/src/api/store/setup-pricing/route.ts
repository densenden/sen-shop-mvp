import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { IPricingModuleService, IProductModuleService } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

// POST /store/setup-pricing - Setup basic pricing for products (development only)
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const pricingService: IPricingModuleService = req.scope.resolve(Modules.PRICING)
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    console.log("Setting up basic pricing for products...")
    
    // Get all products
    const products = await productService.listProducts({}, {
      relations: ["variants"]
    })
    
    console.log(`Found ${products.length} products`)
    
    const pricesCreated = []
    
    // Create basic pricing for each variant
    for (const product of products) {
      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          try {
            // Create a basic price set for the variant
            const priceSet = await pricingService.createPriceSets({
              prices: [
                {
                  amount: 2000, // $20.00 in cents
                  currency_code: "USD",
                  rules: {}
                },
                {
                  amount: 1800, // €18.00 in cents
                  currency_code: "EUR",
                  rules: {}
                }
              ]
            })
            
            // Link the price set to the variant using remote query
            await remoteQuery.graph({
              entity: "product_variant_price_set",
              body: {
                create: [
                  {
                    variant: variant.id,
                    price_set: priceSet.id
                  }
                ]
              }
            })
            
            pricesCreated.push({
              product_id: product.id,
              variant_id: variant.id,
              price_set_id: priceSet.id
            })
            
            console.log(`Created and linked pricing for variant ${variant.id}`)
          } catch (error) {
            console.error(`Error creating pricing for variant ${variant.id}:`, error.message)
          }
        }
      }
    }
    
    res.json({
      success: true,
      message: `Created pricing for ${pricesCreated.length} variants`,
      prices_created: pricesCreated
    })
    
  } catch (error) {
    console.error("[Setup Pricing] Error:", error)
    res.status(500).json({
      error: "Failed to setup pricing",
      message: error.message
    })
  }
}