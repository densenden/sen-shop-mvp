import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Get order service from Medusa v2
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    
    try {
      // Fetch orders that need fulfillment (POD products)
      const orders = await orderModuleService.listOrders({
        // Filter for orders with POD products
      })

      // Transform orders to fulfillment order format
      const fulfillmentOrders = orders
        .filter(order => {
          // Only include orders that have POD products
          return order.items?.some(item => 
            item.metadata?.fulfillment_type === 'printful_pod'
          )
        })
        .map(order => {
          // Find customer info
          const customerName = order.customer_id ? 
            `${order.shipping_address?.first_name || 'Customer'} ${order.shipping_address?.last_name || ''}`.trim() :
            'Guest Customer'

          return {
            id: `fo_${order.id}`,
            medusa_order_id: order.id,
            printful_order_id: order.metadata?.printful_order_id || null,
            provider_type: 'printful',
            status: getFulfillmentStatus(order),
            tracking_number: order.metadata?.tracking_number,
            tracking_url: order.metadata?.tracking_url,
            shipped_at: order.metadata?.shipped_at,
            delivered_at: order.metadata?.delivered_at,
            estimated_delivery: order.metadata?.estimated_delivery,
            customer_email: order.email,
            customer_name: customerName,
            total_amount: order.total ? Number(order.total) / 100 : 0, // Convert from cents
            currency: order.currency_code?.toUpperCase() || 'USD',
            created_at: order.created_at,
            updated_at: order.updated_at
          }
        })

      res.json({
        orders: fulfillmentOrders,
        total: fulfillmentOrders.length
      })

    } catch (error) {
      console.error("Error fetching orders:", error)
      // Return empty state on error
      res.json({
        orders: [],
        total: 0
      })
    }

  } catch (error) {
    console.error("Fulfillment orders API error:", error)
    res.status(500).json({ 
      message: "Internal server error",
      orders: [],
      total: 0
    })
  }
}

function getFulfillmentStatus(order: any): string {
  // Determine fulfillment status based on order metadata and status
  if (order.metadata?.fulfillment_status) {
    return order.metadata.fulfillment_status
  }
  
  if (order.metadata?.delivered_at) {
    return 'delivered'
  }
  
  if (order.metadata?.shipped_at || order.metadata?.tracking_number) {
    return 'shipped'
  }
  
  if (order.metadata?.printful_order_id) {
    return 'processing'
  }
  
  return 'pending'
}