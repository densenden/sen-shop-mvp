import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation"

// Subscribe to order placement events
export default async function orderConfirmationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string, data?: any }>) {
  console.log(`[Order Confirmation Subscriber] 📧 Order placed event received for order: ${event.data.id}`)
  
  try {
    // Get order data from the event
    const orderData = event.data.data
    
    if (!orderData || !orderData.email) {
      console.error("[Order Confirmation Subscriber] ❌ No order data or customer email in event")
      console.log("[Order Confirmation Subscriber] Event data:", JSON.stringify(event.data, null, 2))
      return
    }
    
    console.log(`[Order Confirmation Subscriber] 📨 Processing order for ${orderData.email}`)
    console.log(`[Order Confirmation Subscriber] Order items: ${orderData.items?.length || 0} items`)
    
    // Prepare email data from actual order
    const emailData = {
      order_id: orderData.id,
      customer_email: orderData.email,
      customer_name: orderData.customer_info?.name || 
                     orderData.customer_info?.first_name || 
                     orderData.email.split('@')[0],
      total_amount: orderData.total || 0,
      currency_code: orderData.currency_code || "usd",
      items: (orderData.items || []).map((item: any) => ({
        title: item.title || item.product_title || item.name || "Product",
        quantity: item.quantity || 1,
        unit_price: item.unit_price || item.price || 0,
        fulfillment_type: item.fulfillment_type || 
                         item.metadata?.fulfillment_type || 
                         item.product?.metadata?.fulfillment_type || 
                         "standard"
      }))
    }
    
    console.log(`[Order Confirmation Subscriber] 🚀 Triggering email workflow for ${emailData.customer_email}`)
    console.log(`[Order Confirmation Subscriber] Order total: $${(emailData.total_amount / 100).toFixed(2)}`)
    console.log(`[Order Confirmation Subscriber] Items to email:`, emailData.items.map(i => `${i.title} (${i.fulfillment_type})`))
    
    // Trigger the email workflow
    const { result } = await sendOrderConfirmationWorkflow(container).run({
      input: emailData
    })
    
    console.log(`[Order Confirmation Subscriber] ✅ Email workflow completed successfully:`, result)
    
  } catch (error) {
    console.error(`[Order Confirmation Subscriber] ❌ Error processing order ${event.data.id}:`, error)
    console.error("[Order Confirmation Subscriber] Full error stack:", error.stack)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}