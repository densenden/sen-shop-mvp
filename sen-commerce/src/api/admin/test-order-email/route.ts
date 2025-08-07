import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendOrderConfirmationWorkflow } from "../../../workflows/send-order-confirmation"
import { Modules } from "@medusajs/framework/utils"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Test Order Email] Testing order confirmation email")
  
  try {
    const { email, name } = req.body as any
    
    if (!email) {
      return res.status(400).json({ 
        error: "Email address is required" 
      })
    }
    
    // Create test order data
    const testOrderId = `test_order_${Date.now()}`
    const testOrderData = {
      order_id: testOrderId,
      customer_email: email,
      customer_name: name || email.split('@')[0],
      total_amount: 5999, // $59.99
      currency_code: "usd",
      items: [
        {
          title: "Digital Artwork - Abstract Design",
          quantity: 1,
          unit_price: 2999,
          fulfillment_type: "digital"
        },
        {
          title: "Canvas Print - Mountain Landscape",
          quantity: 1,
          unit_price: 3000,
          fulfillment_type: "printful_pod"
        }
      ]
    }
    
    console.log(`[Test Order Email] Sending test email to: ${email}`)
    
    // Send email directly via workflow
    const { result } = await sendOrderConfirmationWorkflow(req.scope).run({
      input: testOrderData
    })
    
    console.log("[Test Order Email] Workflow result:", result)
    
    // Also test event emission
    try {
      const eventBus = req.scope.resolve(Modules.EVENT_BUS)
      await eventBus.emit("order.placed", { 
        id: testOrderId,
        data: {
          id: testOrderId,
          customer_email: email,
          customer_name: name || email.split('@')[0],
          total: 5999,
          currency_code: "usd",
          items: testOrderData.items
        }
      })
      console.log("[Test Order Email] Event emitted successfully")
    } catch (eventError) {
      console.error("[Test Order Email] Failed to emit event:", eventError)
    }
    
    res.json({
      success: true,
      message: `Test order confirmation email sent to ${email}`,
      order_id: testOrderId
    })
    
  } catch (error) {
    console.error("[Test Order Email] Error:", error)
    res.status(500).json({ 
      error: "Failed to send test email",
      details: error.message 
    })
  }
}