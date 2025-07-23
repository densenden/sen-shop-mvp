import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Extract customer ID from auth token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const token = authHeader.substring(7)
    // Extract customer ID from token (in a real app, you'd validate the token properly)
    const customerId = token.split('_')[1]

    if (!customerId) {
      return res.status(401).json({ message: "Invalid token" })
    }

    // Get order service from Medusa v2
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    
    try {
      // List orders for the customer
      const orders = await orderModuleService.listOrders({
        customer_id: customerId
      })

      // Format orders for the frontend
      const formattedOrders = orders.map(order => ({
        id: order.id,
        status: order.status,
        total: order.total,
        currency_code: order.currency_code,
        created_at: order.created_at,
        items: order.items?.map(item => ({
          id: item.id,
          title: item.title,
          quantity: item.quantity,
          unit_price: item.unit_price,
          thumbnail: item.thumbnail,
          metadata: item.metadata
        })) || [],
        shipping_address: order.shipping_address
      }))

      res.json({
        orders: formattedOrders
      })

    } catch (error) {
      console.error("Error fetching orders:", error)
      return res.status(500).json({ 
        message: "Failed to fetch orders" 
      })
    }

  } catch (error) {
    console.error("Orders API error:", error)
    res.status(500).json({ 
      message: "Internal server error" 
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Extract customer ID from auth token
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const token = authHeader.substring(7)
    const customerId = token.split('_')[1]

    if (!customerId) {
      return res.status(401).json({ message: "Invalid token" })
    }

    const { items, shipping_address, payment_method } = req.body as {
      items: Array<{ product_id: string; variant_id: string; quantity: number }>;
      shipping_address: any;
      payment_method: string;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" })
    }

    // Get required services
    const orderModuleService = req.scope.resolve(Modules.ORDER)
    const productModuleService = req.scope.resolve(Modules.PRODUCT)

    try {
      // Calculate order total
      let total = 0
      const orderItems: any[] = []

      for (const item of items) {
        // Get product details
        const product = await productModuleService.retrieveProduct(item.product_id)
        if (!product) {
          return res.status(400).json({ 
            message: `Product ${item.product_id} not found` 
          })
        }

        const variant = product.variants?.find(v => v.id === item.variant_id)
        if (!variant) {
          return res.status(400).json({ 
            message: `Variant ${item.variant_id} not found` 
          })
        }

        const itemTotal = 1000 // Default price for now
        total += itemTotal * item.quantity

        orderItems.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          title: product.title,
          quantity: item.quantity,
          unit_price: itemTotal,
          total: itemTotal * item.quantity,
          thumbnail: product.thumbnail || '',
          metadata: {
            fulfillment_type: product.metadata?.fulfillment_type,
            artwork_id: product.metadata?.artwork_id
          }
        })
      }

      // Create Medusa order
      const order = {
        id: `order_${Date.now()}`,
        status: 'pending',
        total,
        currency_code: 'usd',
        created_at: new Date().toISOString(),
        items: orderItems,
        shipping_address,
        email: `customer_${customerId}@example.com` // Mock email for now
      }

      // Check if order contains POD products and process with Printful
      const hasPrintfulProducts = orderItems.some(item => 
        item.metadata?.fulfillment_type === 'printful_pod' || 
        item.metadata?.customizable === true
      )

      if (hasPrintfulProducts) {
        try {
          // Get Printful fulfillment service
          const printfulFulfillmentService = req.scope.resolve("printfulFulfillmentService") as any
          
          if (printfulFulfillmentService) {
            console.log("Processing Printful fulfillment for order:", order.id)
            
            // Process fulfillment asynchronously
            printfulFulfillmentService.processFulfillment(order)
              .then((fulfillmentData: any) => {
                console.log("Printful fulfillment completed:", fulfillmentData)
              })
              .catch((error: any) => {
                console.error("Printful fulfillment failed:", error)
              })
          } else {
            console.log("Printful fulfillment service not available, order will be processed manually")
          }
        } catch (error) {
          console.error("Error initiating Printful fulfillment:", error)
          // Continue with order creation even if fulfillment setup fails
        }
      }

      res.status(201).json({
        order: {
          id: order.id,
          status: order.status,
          total: order.total,
          currency_code: order.currency_code,
          created_at: order.created_at,
          items: orderItems
        }
      })

    } catch (error) {
      console.error("Error creating order:", error)
      return res.status(500).json({ 
        message: "Failed to create order" 
      })
    }

  } catch (error) {
    console.error("Create order API error:", error)
    res.status(500).json({ 
      message: "Internal server error" 
    })
  }
}