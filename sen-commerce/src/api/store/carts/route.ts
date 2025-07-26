import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createCartWorkflow } from "@medusajs/medusa/core-flows"

// POST /api/store/carts - Create new cart (Medusa v2 standard)
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { region_id, currency_code = "eur", ...rest } = req.body as any
    
    console.log("Creating cart with:", { region_id, currency_code, ...rest })
    
    // Use Medusa's standard create cart workflow
    const { result } = await createCartWorkflow(req.scope).run({
      input: {
        region_id: region_id || "reg_01JXAMMJEW67HVN6167BJ7513K", // Default to Europe region
        currency_code,
        ...rest
      }
    })
    
    console.log("Cart created:", result)
    
    // Set cart ID in session
    if (req.session) {
      req.session.cart_id = result.id
    }
    
    res.json({ 
      cart: result,
      message: "Cart created successfully" 
    })
    
  } catch (error) {
    console.error("[Store Carts] Error creating cart:", error)
    res.status(500).json({ 
      error: "Failed to create cart",
      message: error.message 
    })
  }
}