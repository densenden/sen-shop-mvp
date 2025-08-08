import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService, IProductModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const orderService: IOrderModuleService = req.scope.resolve(Modules.ORDER)
    const productService: IProductModuleService = req.scope.resolve(Modules.PRODUCT)
    
    // Get all orders using Medusa v2 service
    const orders = await orderService.listOrders({
      relations: ["items", "items.product", "shipping_address", "billing_address"],
    }, { take: 100, order: { created_at: "DESC" } })
    
    console.log(`Found ${orders.length} orders to process for fulfillment dashboard`)

    // For now, we'll use mock tracking data for Printful orders
    // In a full implementation, you would query your Printful tracking table
    const printfulTrackingMock = new Map()
    const digitalDownloadsMock = new Map()

    // Transform orders for fulfillment dashboard
    const fulfillmentOrders = orders.map(order => {
      // Determine provider type based on product metadata
      let providerType = 'standard'
      let hasPrintfulProducts = false
      let hasDigitalProducts = false
      
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.product?.metadata?.fulfillment_type === 'printful_pod') {
            hasPrintfulProducts = true
            providerType = 'printful'
          } else if (item.product?.metadata?.fulfillment_type === 'digital') {
            hasDigitalProducts = true
            if (providerType === 'standard') providerType = 'digital'
          }
        }
      }
      
      // Determine status based on order fulfillment status
      let status = 'pending'
      switch (order.fulfillment_status) {
        case 'fulfilled':
          status = 'delivered'
          break
        case 'shipped':
          status = 'shipped'
          break
        case 'partially_fulfilled':
          status = 'processing'
          break
        case 'not_fulfilled':
          status = order.payment_status === 'captured' ? 'pending' : 'pending'
          break
        default:
          status = 'pending'
      }
      
      // For digital products, they're "delivered" immediately after payment
      if (providerType === 'digital' && order.payment_status === 'captured') {
        status = 'delivered'
      }
      
      const customerName = order.shipping_address 
        ? `${order.shipping_address.first_name || ''} ${order.shipping_address.last_name || ''}`.trim()
        : order.billing_address 
        ? `${order.billing_address.first_name || ''} ${order.billing_address.last_name || ''}`.trim()
        : order.email?.split('@')[0] || 'Unknown'

      return {
        id: `fulfillment_${order.id}`,
        medusa_order_id: order.id,
        printful_order_id: null, // Would be populated from tracking data
        provider_type: providerType,
        status,
        tracking_number: null,
        tracking_url: null,
        shipped_at: null,
        delivered_at: status === 'delivered' ? new Date().toISOString() : null,
        estimated_delivery: null,
        customer_email: order.email,
        customer_name: customerName,
        total_amount: order.total ? order.total / 100 : 0, // Convert from cents
        currency: order.currency_code?.toUpperCase() || 'USD',
        created_at: order.created_at,
        updated_at: order.updated_at,
        order_number: order.display_id?.toString() || order.id
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

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]