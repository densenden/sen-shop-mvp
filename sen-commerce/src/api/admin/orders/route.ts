import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Admin Orders] Fetching orders list")
  
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    
    // Use query service to get orders with summary data
    const { data: ordersList } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "status", 
        "payment_status",
        "fulfillment_status",
        "created_at",
        "updated_at",
        "email",
        "currency_code",
        "metadata",
        "summary.*",
        "summary.totals"
      ],
      pagination: {
        take: 50,
        skip: 0
      }
    })
    
    // Try to fetch orders from database
    let orders = []
    try {
      // Sort by creation date (newest first)  
      const sortedOrders = (ordersList || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      orders = sortedOrders.map(order => {
        // Format timestamp for better display
        const createdDate = new Date(order.created_at)
        const formattedDateTime = createdDate.toLocaleString('de-DE', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Europe/Berlin'
        })
        
        // Get total from summary if available
        const orderTotal = order.summary?.totals?.current_order_total || 0
        
        return {
          id: order.id,
          display_id: order.display_id,
          status: order.status,
          created_at: order.created_at,
          updated_at: order.updated_at || order.created_at,
          email: order.email,
          payment_status: order.payment_status || 'captured',
          fulfillment_status: order.fulfillment_status || 'not_fulfilled',
          total: orderTotal,
          amount: orderTotal, // Duplicate for compatibility
          currency_code: 'EUR', // Force EUR for admin display
          formatted_date: formattedDateTime, // Add formatted date for display
          // Add payment collection structure that admin UI expects
          payment_collections: [
            {
              id: `payment_col_${order.id}`,
              status: 'captured',
              amount: orderTotal,
              currency_code: 'EUR'
            }
          ],
        payments: [
          {
            id: `payment_${order.id}`,
            amount: orderTotal,
            currency_code: 'EUR',
            provider_id: 'stripe',
            captured_at: order.created_at,
            data: {}
          }
        ],
        customer: {
          id: order.customer_id,
          email: order.email,
          first_name: order.metadata?.customer_name?.split(' ')[0] || 'Customer',
          last_name: order.metadata?.customer_name?.split(' ').slice(1).join(' ') || ''
        },
        sales_channel: {
          id: 'default',
          name: 'Default Sales Channel'
        }
        }
      })
      
      console.log(`[Admin Orders] Found ${orders.length} orders in database`)
      
    } catch (dbError) {
      console.error("[Admin Orders] Database error:", dbError)
      // Return proper error instead of fake data
      return res.status(500).json({
        error: "Unable to retrieve orders from database",
        message: "Database connection failed. Please check database connectivity.",
        orders: [],
        count: 0,
        offset: 0,
        limit: 50
      })
    }
    
    console.log(`[Admin Orders] Returning ${orders.length} total orders`)
    
    res.json({
      orders,
      count: orders.length,
      offset: 0,
      limit: 50
    })
    
  } catch (error) {
    console.error("[Admin Orders] Error:", error)
    
    // Return empty list on error
    res.json({
      orders: [],
      count: 0,
      offset: 0,
      limit: 50
    })
  }
}