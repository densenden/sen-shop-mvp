import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ICartModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// GET /store/carts/{id} - Retrieve cart by ID (Medusa v2 standard)
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    
    const cartId = req.params.id
    
    if (!cartId) {
      return res.status(400).json({ 
        error: "Cart ID required",
        message: "Cart ID must be provided in URL path" 
      })
    }
    
    const cart = await cartService.retrieveCart(cartId, {
      relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
    })
    
    res.json({ cart })
    
  } catch (error) {
    console.error("[Store Cart Retrieve] Error getting cart:", error)
    res.status(500).json({ 
      error: "Failed to get cart",
      message: error.message 
    })
  }
}

// POST /store/carts/{id} - Update cart (Medusa v2 standard)
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    
    const cartId = req.params.id
    
    if (!cartId) {
      return res.status(400).json({ 
        error: "Cart ID required",
        message: "Cart ID must be provided in URL path" 
      })
    }
    
    const cart = await cartService.updateCarts(cartId, req.body as any)
    
    res.json({ 
      cart,
      message: "Cart updated successfully" 
    })
    
  } catch (error) {
    console.error("[Store Cart Update] Error updating cart:", error)
    res.status(500).json({ 
      error: "Failed to update cart",
      message: error.message 
    })
  }
}

// DELETE /store/carts/{id} - Delete cart (Medusa v2 standard)
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartService: ICartModuleService = req.scope.resolve(Modules.CART)
    
    const cartId = req.params.id
    
    if (!cartId) {
      return res.status(400).json({ 
        error: "Cart ID required",
        message: "Cart ID must be provided in URL path" 
      })
    }
    
    await cartService.deleteCarts(cartId)
    
    res.json({ 
      message: "Cart deleted successfully" 
    })
    
  } catch (error) {
    console.error("[Store Cart Delete] Error deleting cart:", error)
    res.status(500).json({ 
      error: "Failed to delete cart",
      message: error.message 
    })
  }
}