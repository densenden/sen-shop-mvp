import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ICartModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// PUT /api/store/cart/items/[id] - Update cart item quantity
export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    
    const cartId = req.session?.cart_id || req.headers["x-cart-id"]
    const itemId = req.params.id
    
    if (!cartId) {
      return res.status(404).json({ 
        error: "Cart not found",
        message: "No cart ID provided" 
      })
    }
    
    if (!itemId) {
      return res.status(400).json({
        error: "Missing item ID",
        message: "Item ID is required"
      })
    }
    
    const { quantity } = req.body as any
    
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        error: "Invalid quantity",
        message: "Quantity must be a non-negative number"
      })
    }
    
    // Update item quantity
    await cartService.updateLineItem(cartId, itemId, {
      quantity
    })
    
    // Retrieve updated cart with relations
    const cart = await cartService.retrieveCart(cartId, {
      relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
    })
    
    res.json({ 
      cart,
      message: "Item updated successfully" 
    })
    
  } catch (error) {
    console.error("[Store Cart Items] Error updating item:", error)
    res.status(500).json({ 
      error: "Failed to update cart item",
      message: error.message 
    })
  }
}

// DELETE /api/store/cart/items/[id] - Remove item from cart
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    
    const cartId = req.session?.cart_id || req.headers["x-cart-id"]
    const itemId = req.params.id
    
    if (!cartId) {
      return res.status(404).json({ 
        error: "Cart not found",
        message: "No cart ID provided" 
      })
    }
    
    if (!itemId) {
      return res.status(400).json({
        error: "Missing item ID",
        message: "Item ID is required"
      })
    }
    
    // Remove item from cart
    await cartService.removeFromCart(cartId, itemId)
    
    // Retrieve updated cart with relations
    const cart = await cartService.retrieveCart(cartId, {
      relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
    })
    
    res.json({ 
      cart,
      message: "Item removed from cart successfully" 
    })
    
  } catch (error) {
    console.error("[Store Cart Items] Error removing item:", error)
    res.status(500).json({ 
      error: "Failed to remove cart item",
      message: error.message 
    })
  }
}