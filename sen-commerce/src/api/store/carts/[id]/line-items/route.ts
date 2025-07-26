import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createCartWorkflow, addToCartWorkflow } from "@medusajs/medusa/core-flows"

// POST /api/store/carts/[id]/line-items - Add line item to cart (Medusa v2 standard)
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const cartId = req.params.id
    const { variant_id, quantity = 1 } = req.body as any
    
    if (!variant_id) {
      return res.status(400).json({
        error: "Missing variant_id",
        message: "variant_id is required"
      })
    }
    
    console.log(`Adding item to cart ${cartId}: variant ${variant_id}, quantity ${quantity}`)
    
    // Use Medusa's standard add to cart workflow
    const { result } = await addToCartWorkflow(req.scope).run({
      input: {
        cart_id: cartId,
        items: [
          {
            variant_id,
            quantity
          }
        ]
      }
    })
    
    console.log("Add to cart result:", result)
    
    res.json({ 
      cart: result,
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