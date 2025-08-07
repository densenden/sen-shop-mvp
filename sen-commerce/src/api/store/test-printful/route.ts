import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import PrintfulOrderService from "../../../services/printful-order-service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Store Printful Test] Testing Printful order creation directly")
  
  try {
    const printfulOrderService = new PrintfulOrderService({})
    
    const testOrderData = {
      external_id: `test_${Date.now()}`,
      recipient: {
        name: "Test User",
        address1: "123 Test St",
        city: "Test City",
        state_code: "CA",
        country_code: "US",
        zip: "12345",
        email: "test@example.com"
      },
      items: [{
        variant_id: "4873127633",
        quantity: 1,
        files: []
      }]
    }
    
    console.log("[Store Printful Test] Creating Printful order with data:", JSON.stringify(testOrderData, null, 2))
    
    const printfulOrder = await printfulOrderService.createOrder(testOrderData)
    
    if (printfulOrder) {
      console.log("[Store Printful Test] Printful order created successfully:", printfulOrder.id)
      res.json({
        success: true,
        printful_order_id: printfulOrder.id,
        message: "Printful order created successfully"
      })
    } else {
      console.log("[Store Printful Test] Failed to create Printful order")
      res.json({
        success: false,
        message: "Failed to create Printful order - check logs and API token"
      })
    }
    
  } catch (error) {
    console.error("[Store Printful Test] Error:", error)
    res.status(500).json({
      success: false,
      error: "Failed to test Printful order creation",
      details: error.message
    })
  }
}