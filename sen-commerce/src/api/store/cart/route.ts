import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ICartModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

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
    
    const cart = await cartService.retrieveCart(cartId, {
      relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
    })
    
    res.json({ cart })
    
  } catch (error) {
    console.error("[Store Cart] Error getting cart:", error)
    res.status(500).json({ 
      error: "Failed to get cart",
      message: error.message 
    })
  }
}

// POST /api/store/cart - Create new cart
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    
    const { region_id, currency_code = "USD", ...rest } = req.body as any
    
    const cart = await cartService.createCarts({
      region_id,
      currency_code,
      ...rest
    })
    
    // Set cart ID in session
    if (req.session) {
      req.session.cart_id = (cart as any).id
    }
    
    res.json({ 
      cart,
      message: "Cart created successfully" 
    })
    
  } catch (error) {
    console.error("[Store Cart] Error creating cart:", error)
    res.status(500).json({ 
      error: "Failed to create cart",
      message: error.message 
    })
  }
}

// PUT /api/store/cart - Update cart
export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    
    const cartId = req.session?.cart_id || req.headers["x-cart-id"]
    
    if (!cartId) {
      return res.status(404).json({ 
        error: "Cart not found",
        message: "No cart ID provided" 
      })
    }
    
    const cart = await cartService.updateCarts(cartId, req.body as any)
    
    res.json({ 
      cart,
      message: "Cart updated successfully" 
    })
    
  } catch (error) {
    console.error("[Store Cart] Error updating cart:", error)
    res.status(500).json({ 
      error: "Failed to update cart",
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
    
    await cartService.deleteCarts(cartId)
    
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