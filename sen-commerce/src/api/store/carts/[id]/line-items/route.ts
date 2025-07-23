import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { addToCartWorkflow } from "@medusajs/medusa/core-flows"
import { ICartModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// POST /store/carts/{id}/line-items - Add line item to cart using workflow (Medusa v2 standard)
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartId = req.params.id
    
    if (!cartId) {
      return res.status(400).json({ 
        error: "Cart ID required",
        message: "Cart ID must be provided in URL path" 
      })
    }
    
    const { variant_id, quantity = 1, unit_price, metadata = {} } = req.body as any
    
    if (!variant_id) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "variant_id is required"
      })
    }
    
    // Use addToCartWorkflow instead of direct service calls
    const { result } = await addToCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        items: [{
          variant_id,
          quantity,
          unit_price: unit_price || 2000, // Default price of $20 if no custom price
          metadata
        }]
      }
    })
    
    // Retrieve updated cart with relations
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    const cart = await cartService.retrieveCart(cartId, {
      relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
    })
    
    res.json({ 
      cart,
      message: "Item added to cart successfully" 
    })
    
  } catch (error) {
    console.error("[Store Cart Line Items] Error adding item:", error)
    res.status(500).json({ 
      error: "Failed to add item to cart",
      message: error.message 
    })
  }
}