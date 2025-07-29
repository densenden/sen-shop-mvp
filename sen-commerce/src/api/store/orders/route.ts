import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

// In-memory storage for orders (in production, use database)
const ordersStore: Map<string, any[]> = new Map()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Get customer ID from token or session
    const customerId = req.user?.customer_id || 'demo_customer'
    
    // Get orders for this customer
    const customerOrders = ordersStore.get(customerId) || []
    
    // Also include a demo order for testing
    const demoOrder = {
      id: "order_demo_01234567890",
      display_id: 1001,
      status: "completed",
      fulfillment_status: "fulfilled",
      payment_status: "captured",
      total: 2500,
      subtotal: 2000,
      tax_total: 200,
      shipping_total: 300,
      currency_code: "usd",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      items: [
        {
          id: "item_01234567890",
          title: "Digital Artwork - Abstract Design",
          quantity: 1,
          unit_price: 2000,
          total: 2000,
          thumbnail: "/placeholder-artwork.jpg",
          product_id: "prod_01234567890",
          variant_id: "variant_01234567890",
          metadata: {
            fulfillment_type: "digital_download",
            digital_download_url: "/store/download/token123",
            artwork_id: "artwork_01234567890"
          }
        }
      ],
      shipping_address: {
        id: "addr_01234567890",
        first_name: "John",
        last_name: "Doe",
        address_1: "123 Main St",
        city: "New York",
        province: "NY",
        postal_code: "10001",
        country_code: "us",
        phone: "+1234567890"
      },
      tracking_links: []
    }
    
    // Combine demo order with actual orders
    const allOrders = [...customerOrders]
    if (customerOrders.length === 0) {
      allOrders.push(demoOrder)
    }
    
    res.json({ orders: allOrders })
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ error: "Failed to fetch orders" })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { cart_id, customer_info, shipping_address, payment_session_id, cart_items, cart_total } = req.body
    
    if (!cart_id || !customer_info || !shipping_address) {
      return res.status(400).json({
        error: "cart_id, customer_info, and shipping_address are required"
      })
    }
    
    // Get customer ID from session or use email as identifier
    const customerId = req.user?.customer_id || customer_info.email || 'demo_customer'
    
    // Create order with actual data
    const orderId = `order_${Date.now()}`
    const order = {
      id: orderId,
      display_id: Math.floor(Math.random() * 9000) + 1000,
      status: "pending",
      fulfillment_status: "not_fulfilled", 
      payment_status: "captured", // Mock as captured for demo
      total: cart_total || 2500,
      subtotal: Math.floor((cart_total || 2500) * 0.8), // Rough calculation
      tax_total: Math.floor((cart_total || 2500) * 0.08),
      shipping_total: Math.floor((cart_total || 2500) * 0.12),
      currency_code: "usd",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_info,
      shipping_address,
      payment_session_id,
      cart_id,
      items: cart_items || [],
      tracking_links: []
    }
    
    // Store order in memory (in production, use database)
    if (!ordersStore.has(customerId)) {
      ordersStore.set(customerId, [])
    }
    const customerOrders = ordersStore.get(customerId)!
    customerOrders.unshift(order) // Add new order at the beginning
    
    console.log('Order created and stored:', order)
    console.log('Total orders for customer:', customerOrders.length)
    
    // Here you would typically:
    // - Save order to database
    // - Trigger order confirmation workflow/emails
    // - Process digital downloads
    // - Send to fulfillment providers (Printful, etc.)
    
    res.json({ 
      success: true,
      order,
      message: "Order created successfully"
    })
  } catch (error) {
    console.error("Error creating order:", error)
    res.status(500).json({ 
      error: "Failed to create order",
      details: error.message 
    })
  }
}

export const middlewares = [
  authenticate("customer", ["session", "bearer"]),
]
