import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendOrderConfirmationWorkflow } from "../workflows/send-order-confirmation"

// Subscribe to order placement events
export default async function orderConfirmationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log(`[Order Confirmation] Order placed event received for order: ${event.data.id}`)
  
  try {
    // Mock order data since we don't have full order retrieval set up
    // In production, you'd fetch the full order details from the database
    const orderData = {
      order_id: event.data.id,
      customer_email: "customer@example.com",
      customer_name: "Customer",
      total_amount: 2500, // $25.00
      currency_code: "usd",
      items: [
        {
          title: "Sample Product",
          quantity: 1,
          unit_price: 2500,
          fulfillment_type: "digital"
        }
      ]
    }
    
    // Trigger the email workflow
    const { result } = await sendOrderConfirmationWorkflow(container).run({
      input: orderData
    })
    
    console.log(`[Order Confirmation] Email workflow completed:`, result)
    
  } catch (error) {
    console.error(`[Order Confirmation] Error processing order ${event.data.id}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}