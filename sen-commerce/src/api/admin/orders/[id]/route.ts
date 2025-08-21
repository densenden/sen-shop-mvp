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
    const orderTotal = order.summary?.current_order_total || 0
    
    console.log(`[Admin Order Detail] Order ${order.display_id}: total=${orderTotal}, summary:`, order.summary)
    
    // Return the real order data without mock content
    const formattedOrder = {
      ...order,
      total: orderTotal,
      summary: order.summary
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