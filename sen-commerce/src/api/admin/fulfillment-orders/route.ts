import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const manager = req.scope.resolve("manager")
    
    // Get all orders with fulfillment information
    // This combines data from multiple sources:
    // 1. Medusa orders
    // 2. Printful fulfillment data
    // 3. Digital product downloads
    
    const orders = await manager.query(`
      SELECT 
        o.id as medusa_order_id,
        o.email as customer_email,
        o.display_id as order_number,
        o.total,
        o.currency_code,
        o.created_at,
        COALESCE(
          TRIM(CONCAT(COALESCE(sa.first_name, ''), ' ', COALESCE(sa.last_name, ''))),
          SPLIT_PART(o.email, '@', 1)
        ) as customer_name,
        
        -- Fulfillment type based on product metadata
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM line_item li 
            JOIN product p ON li.product_id = p.id 
            WHERE li.order_id = o.id 
            AND p.metadata->>'fulfillment_type' = 'printful_pod'
          ) THEN 'printful'
          WHEN EXISTS (
            SELECT 1 FROM line_item li 
            JOIN product p ON li.product_id = p.id 
            WHERE li.order_id = o.id 
            AND p.metadata->>'fulfillment_type' = 'digital'
          ) THEN 'digital'
          ELSE 'standard'
        END as provider_type,
        
        -- Try to determine status
        CASE 
          WHEN o.fulfillment_status = 'fulfilled' THEN 'delivered'
          WHEN o.fulfillment_status = 'shipped' THEN 'shipped'
          WHEN o.fulfillment_status = 'partially_fulfilled' THEN 'processing'
          WHEN o.payment_status = 'captured' THEN 'pending'
          ELSE 'pending'
        END as status,
        
        o.fulfillment_status,
        o.payment_status
        
      FROM "order" o
      LEFT JOIN shipping_address sa ON o.shipping_address_id = sa.id
      WHERE o.deleted_at IS NULL
      ORDER BY o.created_at DESC
      LIMIT 100
    `)

    // Get additional fulfillment data from PrintfulOrderTracking if it exists
    const printfulTracking = await manager.query(`
      SELECT 
        medusa_order_id,
        printful_order_id,
        status as printful_status,
        tracking_number,
        tracking_url,
        shipped_at,
        estimated_delivery,
        updated_at
      FROM printful_order_tracking 
      WHERE deleted_at IS NULL
    `).catch(() => [])

    // Get digital download data
    const digitalDownloads = await manager.query(`
      SELECT 
        dd.order_id as medusa_order_id,
        COUNT(dd.id) as download_count,
        MAX(dd.created_at) as download_created_at,
        BOOL_AND(dd.is_active) as all_downloads_active
      FROM digital_product_download dd
      WHERE dd.deleted_at IS NULL
      GROUP BY dd.order_id
    `).catch(() => [])

    // Create lookup maps
    const printfulMap = new Map(printfulTracking.map(p => [p.medusa_order_id, p]))
    const digitalMap = new Map(digitalDownloads.map(d => [d.medusa_order_id, d]))

    // Combine the data
    const fulfillmentOrders = orders.map(order => {
      const printfulData = printfulMap.get(order.medusa_order_id)
      const digitalData = digitalMap.get(order.medusa_order_id)
      
      let status = order.status
      let trackingNumber = null
      let trackingUrl = null
      let shippedAt = null
      let estimatedDelivery = null
      let printfulOrderId = null

      // Override with more specific data if available
      if (printfulData) {
        printfulOrderId = printfulData.printful_order_id
        trackingNumber = printfulData.tracking_number
        trackingUrl = printfulData.tracking_url
        shippedAt = printfulData.shipped_at
        estimatedDelivery = printfulData.estimated_delivery
        
        // Use Printful status if available
        if (printfulData.printful_status) {
          switch (printfulData.printful_status.toLowerCase()) {
            case 'confirmed':
            case 'in_production':
              status = 'processing'
              break
            case 'shipped':
              status = 'shipped'
              break
            case 'delivered':
              status = 'delivered'
              break
            case 'cancelled':
              status = 'cancelled'
              break
          }
        }
      }

      // For digital products, they're immediately "delivered" when downloads are created
      if (order.provider_type === 'digital' && digitalData) {
        status = digitalData.all_downloads_active ? 'delivered' : 'cancelled'
      }

      return {
        id: `fulfillment_${order.medusa_order_id}`,
        medusa_order_id: order.medusa_order_id,
        printful_order_id: printfulOrderId,
        provider_type: order.provider_type,
        status,
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        shipped_at: shippedAt,
        delivered_at: status === 'delivered' ? (shippedAt || order.created_at) : null,
        estimated_delivery: estimatedDelivery,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
        total_amount: order.total ? parseFloat(order.total) / 100 : 0, // Convert from cents
        currency: order.currency_code?.toUpperCase() || 'USD',
        created_at: order.created_at,
        updated_at: printfulData?.updated_at || order.created_at,
        order_number: order.order_number
      }
    })

    // Calculate stats
    const stats = fulfillmentOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      acc.total += 1
      return acc
    }, {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      total: 0
    })

    res.json({
      orders: fulfillmentOrders,
      stats
    })
  } catch (error) {
    console.error("Error fetching fulfillment orders:", error)
    res.status(500).json({
      error: "Failed to fetch fulfillment orders",
      details: error.message,
      orders: [],
      stats: {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        total: 0
      }
    })
  }
}