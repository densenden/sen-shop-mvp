import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"

// Subscribe to order placement events to handle Printful fulfillment
export default async function printfulOrderHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  console.log(`[Printful Fulfillment] Order placed event received for order: ${event.data.id}`)
  
  try {
    // Get the order with all details
    const orderModuleService = container.resolve(Modules.ORDER)
    const order = await orderModuleService.retrieveOrder(event.data.id, {
      relations: ["items", "items.product", "shipping_address", "billing_address"]
    })

    if (!order) {
      console.log(`[Printful Fulfillment] Order ${event.data.id} not found`)
      return
    }

    console.log(`[Printful Fulfillment] Processing order ${order.id} with ${order.items?.length || 0} items`)

    // Check if order has Printful POD products
    const printfulItems = order.items?.filter(item => 
      item.product?.metadata?.fulfillment_type === "printful_pod"
    ) || []

    if (printfulItems.length === 0) {
      console.log(`[Printful Fulfillment] No Printful products in order ${order.id}`)
      return
    }

    console.log(`[Printful Fulfillment] Found ${printfulItems.length} Printful items in order ${order.id}`)

    // Get Printful service
    const printfulService = container.resolve("printfulModule") as any
    
    if (!printfulService) {
      console.error(`[Printful Fulfillment] Printful service not available`)
      return
    }

    // Create Printful order payload
    const printfulOrderData = {
      recipient: {
        name: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim() || 'Customer',
        address1: order.shipping_address?.address_1 || '',
        address2: order.shipping_address?.address_2 || '',
        city: order.shipping_address?.city || '',
        state_code: order.shipping_address?.province || '',
        country_code: order.shipping_address?.country_code?.toUpperCase() || 'US',
        zip: order.shipping_address?.postal_code || '',
        phone: order.shipping_address?.phone || '',
        email: order.email || ''
      },
      items: printfulItems.map(item => ({
        variant_id: item.product.metadata.printful_product_id,
        quantity: item.quantity,
        files: [], // Will be populated with artwork files later
        name: item.product.title
      })),
      retail_costs: {
        currency: order.currency_code?.toUpperCase() || 'USD',
        subtotal: Math.round(order.total / 100), // Convert from cents
        shipping: 0, // Will be calculated by Printful
        tax: 0
      }
    }

    console.log(`[Printful Fulfillment] Creating Printful order for Medusa order ${order.id}`)
    console.log(`[Printful Fulfillment] Recipient: ${printfulOrderData.recipient.name}`)
    console.log(`[Printful Fulfillment] Items: ${printfulOrderData.items.length}`)

    // Create order in Printful
    try {
      const printfulOrder = await printfulService.createOrder(printfulOrderData)
      
      console.log(`[Printful Fulfillment] ✅ Successfully created Printful order ${printfulOrder.id} for Medusa order ${order.id}`)
      
      // TODO: Store the Printful order ID in Medusa order metadata
      // TODO: Update order status to indicate Printful processing
      
    } catch (printfulError) {
      console.error(`[Printful Fulfillment] ❌ Failed to create Printful order for ${order.id}:`, printfulError.message)
      
      // TODO: Mark order as failed fulfillment
      // TODO: Send notification about fulfillment failure
    }
    
  } catch (error) {
    console.error(`[Printful Fulfillment] Error processing order ${event.data.id}:`, error)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}