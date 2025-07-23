import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"

// POST /store/carts - Create new cart using workflow (Medusa v2 standard)
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { region_id, currency_code = "USD", customer_id, email, sales_channel_id, items = [], ...rest } = req.body as any
    
    // Use createCartWorkflow instead of direct service calls
    const { result: cart } = await createCartWorkflow(req.scope).run({
      input: {
        region_id,
        currency_code,
        customer_id,
        email,
        sales_channel_id,
        items,
        ...rest
      }
    })
    
    // Set cart ID in session for compatibility
    if (req.session) {
      req.session.cart_id = cart.id
    }
    
    res.json({ 
      cart,
      message: "Cart created successfully" 
    })
    
  } catch (error) {
    console.error("[Store Carts Create] Error creating cart:", error)
    res.status(500).json({ 
      error: "Failed to create cart",
      message: error.message 
    })
  }
}