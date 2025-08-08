import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { medusa_order_id } = req.body
    
    if (!medusa_order_id) {
      return res.status(400).json({ error: "medusa_order_id is required" })
    }
    
    console.log(`[CREATE PRINTFUL ORDER] Creating Printful order for: ${medusa_order_id}`)
    
    // Call our Printful order creation endpoint
    const createOrderResponse = await fetch(`${req.protocol}://${req.get('host')}/admin/printful/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.cookie || ''
      },
      body: JSON.stringify({ medusa_order_id })
    })
    
    const result = await createOrderResponse.json()
    
    if (!createOrderResponse.ok) {
      return res.status(createOrderResponse.status).json(result)
    }
    
    res.json({
      success: true,
      message: "Printful order creation initiated",
      ...result
    })
    
  } catch (error) {
    console.error("[CREATE PRINTFUL ORDER] Error:", error)
    res.status(500).json({
      error: "Failed to create Printful order",
      details: error.message
    })
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]