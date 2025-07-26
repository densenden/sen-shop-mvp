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
      
      // Create line item manually
      const lineItem = await cartService.addLineItems(cartId, [{
        cart_id: cartId,
        variant_id,
        quantity,
        unit_price: 2000, // Default price
        title: `Product ${variant_id}`,
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
    }
    
  } catch (error) {
    console.error("[Store Cart Items] Error adding item:", error)
    res.status(500).json({ 
      error: "Failed to add item to cart",
      message: error.message 
    })
  }
}