import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { ICartModuleService } from "@medusajs/types"

// GET /api/store/cart - Get current cart
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    
    // Get cart ID from session/headers
    const cartId = req.session?.cart_id || req.headers["x-cart-id"]
    
    if (!cartId) {
      return res.status(404).json({ 
        error: "Cart not found",
        message: "No cart ID provided" 
      })
    }
    
    try {
      const cart = await cartService.retrieveCart(cartId, {
        relations: ["items", "items.variant", "items.product"]
      })
      
      res.json({ cart })
    } catch (cartError) {
      return res.status(404).json({ 
        error: "Cart not found",
        message: "Cart does not exist" 
      })
    }
    
  } catch (error) {
    console.error("[Store Cart] Error getting cart:", error)
    res.status(500).json({ 
      error: "Failed to get cart",
      message: error.message 
    })
  }
}

// DELETE /api/store/cart - Delete cart
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    
    const cartId = req.session?.cart_id || req.headers["x-cart-id"]
    
    if (!cartId) {
      return res.status(404).json({ 
        error: "Cart not found",
        message: "No cart ID provided" 
      })
    }
    
    await cartService.deleteCarts([cartId])
    
    // Clear cart ID from session
    if (req.session) {
      req.session.cart_id = undefined
    }
    
    res.json({ 
      message: "Cart deleted successfully" 
    })
    
  } catch (error) {
    console.error("[Store Cart] Error deleting cart:", error)
    res.status(500).json({ 
      error: "Failed to delete cart",
      message: error.message 
    })
  }
}
