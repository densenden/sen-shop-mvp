import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ICartModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// PUT /api/store/cart/addresses - Update cart addresses
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
    
    const { shipping_address, billing_address } = req.body as any
    
    const updateData: any = {}
    
    if (shipping_address) {
      updateData.shipping_address = shipping_address
    }
    
    if (billing_address) {
      updateData.billing_address = billing_address
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No address data provided",
        message: "Provide shipping_address or billing_address"
      })
    }
    
    // Update cart addresses
    await cartService.updateCarts(cartId, updateData)
    
    // Retrieve updated cart with relations
    const cart = await cartService.retrieveCart(cartId, {
      relations: ["items", "items.variant", "items.product", "shipping_address", "billing_address"]
    })
    
    res.json({ 
      cart,
      message: "Cart addresses updated successfully" 
    })
    
  } catch (error) {
    console.error("[Store Cart Addresses] Error updating addresses:", error)
    res.status(500).json({ 
      error: "Failed to update cart addresses",
      message: error.message 
    })
  }
}