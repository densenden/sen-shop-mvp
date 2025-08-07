import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Test Order Flow] 🧪 Testing complete order and email flow")
  
  try {
    const { email, name } = req.body as any
    
    if (!email) {
      return res.status(400).json({ 
        error: "Email address is required" 
      })
    }
    
    // Create test order data that will trigger all flows
    const testOrderData = {
      cart_id: `test_cart_${Date.now()}`,
      customer_info: {
        email: email,
        name: name || email.split('@')[0],
        first_name: name?.split(' ')[0] || email.split('@')[0],
        last_name: name?.split(' ')[1] || ""
      },
      shipping_address: {
        first_name: name?.split(' ')[0] || email.split('@')[0],
        last_name: name?.split(' ')[1] || "",
        address_1: "123 Test Street",
        city: "Test City",
        postal_code: "12345",
        country_code: "us"
      },
      cart_items: [
        {
          id: "test_item_1",
          title: "Digital Artwork - Test Design",
          quantity: 1,
          unit_price: 2500,
          price: 2500,
          fulfillment_type: "digital",
          metadata: {
            fulfillment_type: "digital",
            digital_product_id: "test_digital_product_123"
          }
        },
        {
          id: "test_item_2", 
          title: "Canvas Print - Test Mountain",
          quantity: 1,
          unit_price: 3000,
          price: 3000,
          fulfillment_type: "printful_pod",
          metadata: {
            fulfillment_type: "printful_pod"
          }
        }
      ],
      cart_total: 5500
    }
    
    console.log(`[Test Order Flow] 📮 Calling orders API with test data for ${email}`)
    
    // Call the orders API to create the order and trigger events
    const orderResponse = await fetch(`${req.headers.host?.includes('localhost') ? 'http' : 'https'}://${req.headers.host}/store/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || ''
      },
      body: JSON.stringify(testOrderData)
    })
    
    const orderResult = await orderResponse.json()
    
    if (!orderResponse.ok) {
      throw new Error(`Order creation failed: ${orderResult.error || 'Unknown error'}`)
    }
    
    console.log(`[Test Order Flow] ✅ Order created successfully: ${orderResult.order?.id}`)
    
    res.json({
      success: true,
      message: `Test order flow initiated for ${email}`,
      order_id: orderResult.order?.id,
      expected_emails: [
        "Order confirmation email",
        "Digital download links email (if digital products exist)"
      ],
      note: "Check the server logs to see the email workflow execution"
    })
    
  } catch (error) {
    console.error("[Test Order Flow] ❌ Error:", error)
    res.status(500).json({ 
      error: "Failed to test order flow",
      details: error.message 
    })
  }
}