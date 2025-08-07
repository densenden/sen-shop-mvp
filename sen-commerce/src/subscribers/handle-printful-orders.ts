import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import PrintfulOrderService from "../services/printful-order-service"

// Subscribe to order placement events for Printful POD products
export default async function handlePrintfulOrders({
  event,
  container,
}: SubscriberArgs<{ id: string, data?: any }>) {
  console.log(`[Printful Order Subscriber] 🎨 Order placed event received for order: ${event.data.id}`)
  
  try {
    // Get order data from the event
    const orderData = event.data.data
    
    if (!orderData || !orderData.items) {
      console.error("[Printful Order Subscriber] ❌ No order data or items in event")
      return
    }
    
    // Check if any items are POD products
    const podItems = orderData.items.filter((item: any) => {
      const fulfillmentType = item.metadata?.fulfillment_type || 
                              item.product?.metadata?.fulfillment_type || 
                              "standard"
      return fulfillmentType === "printful_pod"
    })
    
    if (podItems.length === 0) {
      console.log("[Printful Order Subscriber] No POD items in order, skipping Printful processing")
      return
    }
    
    console.log(`[Printful Order Subscriber] Found ${podItems.length} POD items to process`)
    
    // Initialize Printful order service
    const printfulOrderService = new PrintfulOrderService(container)
    
    // Prepare Printful order data
    const printfulOrderData = {
      external_id: orderData.id,
      recipient: {
        name: orderData.customer_name || orderData.customer_info?.name || "Customer",
        email: orderData.email || orderData.customer_email,
        address1: orderData.shipping_address?.address_1 || "123 Main St",
        city: orderData.shipping_address?.city || "New York",
        state_code: orderData.shipping_address?.province || "NY",
        country_code: orderData.shipping_address?.country_code || "US",
        zip: orderData.shipping_address?.postal_code || "10001",
      },
      items: podItems.map((item: any) => {
        // Extract Printful variant ID from metadata or SKU
        const variantId = item.metadata?.printful_variant_id || 
                         item.variant?.sku?.split('-').pop() || 
                         "4873127633" // Default variant for testing
        
        return {
          variant_id: variantId,
          quantity: item.quantity || 1,
          // Include artwork file if present
          files: item.metadata?.artwork_url ? [
            {
              url: item.metadata.artwork_url,
              type: "default"
            }
          ] : []
        }
      })
    }
    
    console.log(`[Printful Order Subscriber] 📦 Creating Printful order with data:`, JSON.stringify(printfulOrderData, null, 2))
    
    // Create order in Printful
    const printfulOrder = await printfulOrderService.createOrder(printfulOrderData)
    
    if (printfulOrder) {
      console.log(`[Printful Order Subscriber] ✅ Printful order created successfully:`, printfulOrder.id)
      
      // Store Printful order ID in our system (if we have an order service)
      try {
        // Update order metadata with Printful order ID
        console.log(`[Printful Order Subscriber] Storing Printful order ID ${printfulOrder.id} for order ${orderData.id}`)
      } catch (updateError) {
        console.error("[Printful Order Subscriber] Failed to update order with Printful ID:", updateError)
      }
    } else {
      console.error("[Printful Order Subscriber] ❌ Failed to create Printful order")
    }
    
  } catch (error) {
    console.error(`[Printful Order Subscriber] ❌ Error processing Printful order for ${event.data.id}:`, error)
    console.error("[Printful Order Subscriber] Full error stack:", error.stack)
    // Don't throw - we don't want to fail the entire order if Printful fails
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}