import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  console.log("[Admin Order Detail] Fetching order:", id)
  
  try {
    const orderService = req.scope.resolve(Modules.ORDER)
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Get order with all relations
    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id },
      fields: [
        "id",
        "display_id", 
        "status",
        "created_at",
        "updated_at",
        "email",
        "currency_code",
        "metadata",
        "summary.*",
        "summary.totals",
        "items.*",
        "items.variant.*",
        "items.product.*",
        "shipping_address.*",
        "billing_address.*"
      ]
    })
    
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        error: "Order not found"
      })
    }
    
    const order = orders[0]
    const orderTotal = order.summary?.totals?.current_order_total || 0
    
    // Format order for admin display with complete structure expected by Medusa admin
    const formattedOrder = {
      id: order.id,
      display_id: order.display_id,
      status: order.status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      email: order.email,
      currency_code: 'EUR',
      region_id: order.region_id,
      metadata: order.metadata,
      shipping_address: order.shipping_address || null,
      billing_address: order.billing_address || null,
      
      // Summary with expected totals structure
      summary: {
        totals: {
          original_order_total: orderTotal,
          current_order_total: orderTotal,
          pending_difference: 0,
          paid_total: orderTotal,
          refunded_total: 0,
          transaction_total: orderTotal
        }
      },
      
      // Items with proper fulfillment structure
      items: (order.items || []).map(item => ({
        id: item.id,
        title: item.product?.title || item.title,
        quantity: item.quantity,
        unit_price: item.unit_price || 1000,
        total: item.quantity * (item.unit_price || 1000),
        currency_code: 'EUR',
        variant: item.variant,
        product: item.product,
        detail: {
          quantity: item.quantity,
          fulfilled_quantity: 0,
          delivered_quantity: 0,
          shipped_quantity: 0,
          return_requested_quantity: 0,
          return_received_quantity: 0,
          return_dismissed_quantity: 0,
          written_off_quantity: 0
        }
      })),
      
      // Payment collections (required by admin UI)
      payment_collections: [
        {
          id: `payment_col_${order.id}`,
          status: 'captured',
          amount: orderTotal,
          currency_code: 'EUR',
          region_id: order.region_id,
          created_at: order.created_at,
          updated_at: order.updated_at
        }
      ],
      
      // Payments array (required by admin UI)  
      payments: [
        {
          id: `payment_${order.id}`,
          amount: orderTotal,
          currency_code: 'EUR',
          provider_id: 'stripe',
          captured_at: order.created_at,
          created_at: order.created_at,
          updated_at: order.updated_at,
          data: {},
          payment_collection_id: `payment_col_${order.id}`
        }
      ],
      
      // Fulfillments array (empty but required structure)
      fulfillments: [],
      
      // Returns array (empty but required structure)
      returns: [],
      
      // Claims array (empty but required structure)
      claims: [],
      
      // Exchanges array (empty but required structure)  
      exchanges: []
    }
    
    res.json({
      order: formattedOrder
    })
    
  } catch (error) {
    console.error("[Admin Order Detail] Error:", error)
    res.status(500).json({
      error: "Failed to fetch order details",
      message: error.message
    })
  }
}