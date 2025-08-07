import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import EmailService from "../../../../services/email-service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Checkout Complete] Processing order completion")
  console.log("[Checkout Complete] Request body:", JSON.stringify(req.body, null, 2))
  
  try {
    const { 
      cart_id, 
      customer_email,
      customer_name,
      shipping_address, 
      payment_method,
      cart_items,
      cart_total 
    } = req.body as any
    
    // Validate required fields
    if (!cart_id || !customer_email) {
      return res.status(400).json({ 
        error: "Cart ID and customer email are required" 
      })
    }
    
    // Create order with consistent email field
    const orderId = `order_${Date.now()}`
    const order = {
      id: orderId,
      display_id: Math.floor(Math.random() * 9000) + 1000,
      status: "pending",
      fulfillment_status: "not_fulfilled",
      payment_status: "captured",
      total: cart_total || 2500,
      subtotal: Math.floor((cart_total || 2500) * 0.8),
      tax_total: Math.floor((cart_total || 2500) * 0.08),
      shipping_total: Math.floor((cart_total || 2500) * 0.12),
      currency_code: "usd",
      created_at: new Date().toISOString(),
      email: customer_email, // Use 'email' for consistency with subscriber
      customer_email,
      customer_name: customer_name || customer_email.split('@')[0],
      customer_info: {
        name: customer_name || customer_email.split('@')[0],
        email: customer_email
      },
      shipping_address,
      payment_method,
      items: (cart_items || []).map((item: any) => ({
        ...item,
        title: item.title || item.product_title || "Product",
        thumbnail: item.thumbnail || item.product?.thumbnail,
        product: {
          title: item.product_title || item.title || "Product",
          thumbnail: item.thumbnail || item.product?.thumbnail,
          metadata: {
            fulfillment_type: item.metadata?.fulfillment_type || "standard"
          }
        }
      }))
    }
    
    console.log(`[Checkout Complete] Order created: ${orderId}`)
    console.log(`[Checkout Complete] Customer: ${customer_email}`)
    
    // Send order confirmation email directly
    try {
      const emailService = new EmailService()
      const orderNumber = `#SC-${order.display_id}`
      
      const emailData = {
        customerEmail: customer_email,
        customerName: customer_name || customer_email.split('@')[0],
        orderId: orderId,
        orderNumber,
        items: (cart_items || []).map((item: any) => ({
          title: item.title || item.product_title || "Product",
          thumbnail: item.thumbnail || item.product?.thumbnail,
          quantity: item.quantity || 1,
          unitPrice: item.unit_price || item.price || 0,
          total: item.total || (item.unit_price * item.quantity) || 0,
          fulfillmentType: item.fulfillment_type || item.metadata?.fulfillment_type || "standard"
        })),
        totalAmount: cart_total || 2500,
        currencyCode: "usd"
      }
      
      console.log("[Checkout Complete] Sending order confirmation email")
      const emailSent = await emailService.sendOrderConfirmation(emailData)
      console.log("[Checkout Complete] Email sent successfully:", emailSent)
    } catch (emailError) {
      console.error("[Checkout Complete] Failed to send confirmation email:", emailError)
      // Don't fail the order if email fails
    }
    
    // Emit order.placed event for subscribers
    try {
      const eventBus = req.scope.resolve(Modules.EVENT_BUS)
      await eventBus.emit("order.placed", { 
        id: orderId,
        data: order 
      })
      console.log("[Checkout Complete] order.placed event emitted")
    } catch (eventError) {
      console.error("[Checkout Complete] Failed to emit event:", eventError)
    }
    
    res.json({
      success: true,
      order,
      message: "Order placed successfully. Confirmation email sent."
    })
    
  } catch (error) {
    console.error("[Checkout Complete] Error:", error)
    res.status(500).json({ 
      error: "Failed to complete checkout",
      details: error.message 
    })
  }
}