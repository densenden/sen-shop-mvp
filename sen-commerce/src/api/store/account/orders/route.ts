import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { customer_email, customer_id, order_ids } = req.query
    console.log(`[Account Orders] Fetching orders for email: ${customer_email}, order_ids: ${order_ids}`)
    
    let orders: any[] = []
    
    // Parse order_ids if provided (comma-separated string)
    let requestedOrderIds: string[] = []
    if (order_ids && typeof order_ids === 'string') {
      requestedOrderIds = order_ids.split(',').filter(id => id.trim())
    }
    
    // Only use database orders - no global storage fallbacks
    
    // Try to get orders from database
    try {
      const orderService = req.scope.resolve(Modules.ORDER)
      const filters: any = {}
      
      if (customer_email) {
        filters.email = customer_email
      }
      if (customer_id) {
        filters.customer_id = customer_id
      }
      if (requestedOrderIds.length > 0) {
        // If specific order IDs requested, use those instead
        filters.id = requestedOrderIds
      }
      
      const ordersList = await orderService.listOrders(
        filters,
        {
          take: 50,
          skip: 0,
          relations: ['items']
        }
      )
      
      if (ordersList && ordersList.length > 0) {
        const dbOrders = ordersList.map((order: any) => ({
          id: order.id,
          display_id: order.display_id,
          status: order.status,
          created_at: order.created_at,
          total: order.total || 0,
          subtotal: order.subtotal || (order.total ? Math.floor(order.total * 0.85) : 0),
          tax_total: order.tax_total || (order.total ? Math.floor(order.total * 0.08) : 0), 
          shipping_total: order.shipping_total || (order.total ? order.total - (order.subtotal || Math.floor(order.total * 0.85)) - (order.tax_total || Math.floor(order.total * 0.08)) : 0),
          currency_code: 'eur',
          payment_status: order.payment_status || 'captured',
          fulfillment_status: order.fulfillment_status || 'not_fulfilled',
          items: order.items?.map((item: any) => ({
            id: item.id,
            title: item.title || 'Product',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            total: item.total || (item.unit_price * item.quantity) || 0,
            thumbnail: null,
            product_handle: null,
            fulfillment_type: item.metadata?.fulfillment_type || 'standard'
          })) || []
        }))
        
        // Combine with memory orders (remove duplicates by ID)
        const existingIds = new Set(orders.map(o => o.id))
        for (const dbOrder of dbOrders) {
          if (!existingIds.has(dbOrder.id)) {
            orders.push(dbOrder)
          }
        }
      }
      
    } catch (dbError) {
      console.error("[Account Orders] Database error:", dbError)
    }
    
    // Sort by created date (newest first)
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    console.log(`[Account Orders] Returning ${orders.length} orders for customer`)
    
    res.json({
      orders,
      count: orders.length
    })
    
  } catch (error) {
    console.error("[Account Orders] Error:", error)
    res.status(500).json({
      error: "Failed to fetch orders",
      message: error.message
    })
  }
}