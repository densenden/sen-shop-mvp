import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

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
    
    // Use query graph to get complete order data with products
    try {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      
      // Build filters for the query
      const filters: any = {}
      if (customer_email) {
        filters.email = customer_email
      }
      if (customer_id) {
        filters.customer_id = customer_id
      }
      if (requestedOrderIds.length > 0) {
        filters.id = requestedOrderIds
      }
      
      // Query orders with all related data
      const { data: ordersList } = await query.graph({
        entity: "order",
        filters,
        fields: [
          "id",
          "display_id",
          "status",
          "email",
          "customer_id",
          "total",
          "subtotal",
          "tax_total",
          "shipping_total",
          "currency_code",
          "created_at",
          "updated_at",
          "payment_status",
          "fulfillment_status",
          "items.*",
          "items.product.*",
          "items.product.images.*",
          "items.variant.*",
          "shipping_address.*",
          "billing_address.*"
        ],
      })
      
      if (ordersList && ordersList.length > 0) {
        const dbOrders = ordersList.map((order: any) => ({
          id: order.id,
          display_id: order.display_id || order.id.slice(-6),
          status: order.status || 'pending',
          created_at: order.created_at,
          updated_at: order.updated_at,
          total: order.total || 0,
          subtotal: order.subtotal || 0,
          tax_total: order.tax_total || 0, 
          shipping_total: order.shipping_total || 0,
          currency_code: order.currency_code || 'eur',
          payment_status: order.payment_status || 'pending',
          fulfillment_status: order.fulfillment_status || 'not_fulfilled',
          shipping_address: order.shipping_address || null,
          billing_address: order.billing_address || null,
          items: order.items?.map((item: any) => {
            // Get product image from product or variant
            let thumbnail = item.product?.thumbnail || null
            if (!thumbnail && item.product?.images?.length > 0) {
              thumbnail = item.product.images[0].url
            }
            if (!thumbnail && item.variant?.product?.thumbnail) {
              thumbnail = item.variant.product.thumbnail
            }
            
            return {
              id: item.id,
              title: item.title || item.product?.title || item.variant?.title || 'Product',
              quantity: item.quantity || 1,
              unit_price: item.unit_price || item.variant?.calculated_price?.calculated_amount || 0,
              total: item.total || (item.unit_price * item.quantity) || 0,
              thumbnail,
              product_id: item.product_id || item.product?.id,
              variant_id: item.variant_id || item.variant?.id,
              product_handle: item.product?.handle || null,
              metadata: {
                fulfillment_type: item.metadata?.fulfillment_type || item.product?.metadata?.fulfillment_type || 'standard',
                digital_download_url: item.metadata?.digital_download_url,
                artwork_id: item.metadata?.artwork_id || item.product?.metadata?.artwork_id
              }
            }
          }) || []
        }))
        
        orders = dbOrders
      }
      
    } catch (dbError) {
      console.error("[Account Orders] Database error:", dbError)
      console.error("[Account Orders] Full error details:", JSON.stringify(dbError, null, 2))
    }
    
    // Sort by created date (newest first)
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    console.log(`[Account Orders] Returning ${orders.length} orders for customer`)
    
    // Ensure all price fields have values
    orders = orders.map(order => ({
      ...order,
      total: order.total || 0,
      subtotal: order.subtotal || 0,
      tax_total: order.tax_total || 0,
      shipping_total: order.shipping_total || 0,
      items: order.items.map((item: any) => ({
        ...item,
        unit_price: item.unit_price || 0,
        total: item.total || 0
      }))
    }))
    
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