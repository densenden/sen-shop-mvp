import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ICartModuleService, IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// POST /api/store/cart/items - Add item to cart
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Use the default cart workflow from Medusa
    const cartWorkflow = req.scope.resolve("cartWorkflowService")
    
    const cartId = req.session?.cart_id || req.headers["x-cart-id"]
    
    if (!cartId) {
      return res.status(404).json({ 
        error: "Cart not found",
        message: "No cart ID provided" 
      })
    }
    
    const { variant_id, quantity = 1 } = req.body as any
    
    if (!variant_id) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "variant_id is required"
      })
    }
    
    try {
      // Use Medusa's built-in add to cart workflow
      const result = await cartWorkflow.addToCart({
        cart_id: cartId,
        items: [
          {
            variant_id,
            quantity
          }
        ]
      })
      
      res.json({ 
        cart: result.cart,
        message: "Item added to cart successfully" 
      })
      
    } catch (workflowError) {
      console.log("Workflow failed, trying direct cart service...")
      
      // Fallback to manual cart service
      const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
      const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
      
      // Get variant price instead of using hardcoded fallback
      let unit_price = 0
      let title = `Product ${variant_id}`
      
      try {
        const [variant] = await productService.listProductVariants(
          { id: variant_id },
          { relations: ["product"] }
        )
        if (variant?.product) {
          title = variant.product.title
          
          // Try to get price from price service
          const query = req.scope.resolve("query")
          const priceData = await query.graph({
            entity: "product_variant_price_set",
            fields: ["variant_id", "price_set_id"],
            filters: { variant_id: variant_id }
          })
          
          if (priceData?.data?.[0]?.price_set_id) {
            const pricingService = req.scope.resolve(Modules.PRICING)
            const prices = await pricingService.listPrices({
              price_set_id: [priceData.data[0].price_set_id]
            })
            
            if (prices && prices.length > 0) {
              const price = prices.find(p => p.currency_code === 'eur') || prices[0]
              unit_price = price.amount
            }
          }
        }
      } catch (priceError) {
        console.error("Error fetching variant price:", priceError)
      }
      
      // Only add to cart if we found a valid price
      if (unit_price > 0) {
        const lineItem = await cartService.addLineItems(cartId, [{
          cart_id: cartId,
          variant_id,
          quantity,
          unit_price,
          title,
          metadata: { variant_id }
        }])
        
        // Get updated cart
        const cart = await cartService.retrieveCart(cartId, {
          relations: ["items"]
        })
        
        res.json({ 
          cart,
          message: "Item added to cart successfully" 
        })
      } else {
        res.status(400).json({
          error: "Product price not found",
          message: "Cannot add item to cart without a valid price"
        })
      }
    }
    
  } catch (error) {
    console.error("[Store Cart Items] Error adding item:", error)
    res.status(500).json({ 
      error: "Failed to add item to cart",
      message: error.message 
    })
  }
}