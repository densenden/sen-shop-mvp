import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService, IProductModuleService } from "@medusajs/types"
import { authenticate } from "@medusajs/medusa"

interface PrintfulOrderItem {
  product_id: string
  variant_id?: string
  quantity: number
  name: string
  retail_price: string
  files?: Array<{
    type: string
    url: string
    position?: string
  }>
}

interface PrintfulOrderRequest {
  recipient: {
    name: string
    company?: string
    address1: string
    address2?: string
    city: string
    state_code: string
    country_code: string
    zip: string
    phone?: string
    email: string
  }
  items: PrintfulOrderItem[]
  retail_costs?: {
    currency: string
    subtotal: string
    discount?: string
    shipping: string
    tax?: string
  }
  gift?: {
    subject?: string
    message?: string
  }
  packing_slip?: {
    email?: string
    phone?: string
    message?: string
    logo_url?: string
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { medusa_order_id, order_data } = req.body
    
    if (!medusa_order_id) {
      return res.status(400).json({ error: "medusa_order_id is required" })
    }
    
    console.log(`[PRINTFUL ORDER] Creating Printful order for Medusa order: ${medusa_order_id}`)
    
    let order = order_data
    
    // If order_data not provided, try to fetch from database
    if (!order) {
      const orderService: IOrderModuleService = req.scope.resolve(Modules.ORDER)
      
      try {
        order = await orderService.retrieveOrder(medusa_order_id, {
          relations: ["items", "items.product", "shipping_address", "billing_address"]
        })
      } catch (error) {
        console.error("[PRINTFUL ORDER] Failed to retrieve order from database:", error)
        return res.status(404).json({ error: "Order not found and no order_data provided" })
      }
    }
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" })
    }
    
    // Check if order contains Printful POD products
    const printfulItems = order.items?.filter((item: any) => {
      const fulfillmentType = item.product?.metadata?.fulfillment_type || 
                             item.metadata?.fulfillment_type ||
                             item.fulfillment_type
      return fulfillmentType === 'printful_pod'
    }) || []
    
    if (printfulItems.length === 0) {
      return res.status(400).json({ error: "No Printful POD products found in order" })
    }
    
    // Prepare Printful order data
    const shippingAddress = order.shipping_address
    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required for Printful orders" })
    }
    
    const printfulOrder: PrintfulOrderRequest = {
      recipient: {
        name: `${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim(),
        company: shippingAddress.company || undefined,
        address1: shippingAddress.address_1 || '',
        address2: shippingAddress.address_2 || undefined,
        city: shippingAddress.city || '',
        state_code: shippingAddress.province || '',
        country_code: shippingAddress.country_code || '',
        zip: shippingAddress.postal_code || '',
        phone: shippingAddress.phone || undefined,
        email: order.email || ''
      },
      items: [],
      retail_costs: {
        currency: order.currency_code?.toUpperCase() || 'USD',
        subtotal: ((order.total || order.subtotal || 0) / 100).toString(), // Convert from cents
        shipping: ((order.shipping_total || 0) / 100).toString(),
        tax: ((order.tax_total || 0) / 100).toString(),
      },
      packing_slip: {
        email: process.env.STORE_EMAIL || 'shop@sen.studio',
        message: "Thank you for your order from SenCommerce!",
        logo_url: process.env.STORE_LOGO_URL || undefined
      }
    }
    
    // Convert order items to Printful format
    for (const item of printfulItems) {
      const printfulProductId = item.product?.metadata?.printful_product_id || 
                               item.metadata?.printful_product_id ||
                               'fallback_product_123' // Fallback for testing
      const printfulVariantId = item.product?.metadata?.printful_variant_id || 
                               item.metadata?.printful_variant_id
      
      if (!printfulProductId || printfulProductId === 'fallback_product_123') {
        console.warn(`Product ${item.product?.id || 'unknown'} has no printful_product_id, using fallback`)
      }
      
      // Get artwork URL for this product
      let artworkUrl = item.product?.metadata?.artwork_url || 
                      item.metadata?.artwork_url
      if (!artworkUrl && (item.product?.metadata?.artwork_id || item.metadata?.artwork_id)) {
        // Fetch artwork URL from artwork API
        try {
          const artworkResponse = await fetch(`${req.protocol}://${req.get('host')}/admin/artworks`, {
            headers: { 'Cookie': req.headers.cookie || '' }
          })
          
          if (artworkResponse.ok) {
            const artworkData = await artworkResponse.json()
            const artwork = artworkData.artworks?.find((a: any) => a.id === item.product?.metadata?.artwork_id)
            if (artwork?.image_url) {
              artworkUrl = artwork.image_url
            }
          }
        } catch (error) {
          console.warn("Failed to fetch artwork URL:", error)
        }
      }
      
      const printfulItem: PrintfulOrderItem = {
        product_id: printfulProductId,
        variant_id: printfulVariantId,
        quantity: item.quantity || 1,
        name: item.title || item.product?.title || 'Custom Product',
        retail_price: ((item.unit_price || 0) / 100).toString(),
      }
      
      // Add artwork file if available
      if (artworkUrl) {
        printfulItem.files = [{
          type: 'default',
          url: artworkUrl,
        }]
      }
      
      printfulOrder.items.push(printfulItem)
    }
    
    if (printfulOrder.items.length === 0) {
      return res.status(400).json({ error: "No valid Printful items to create order" })
    }
    
    // Send order to Printful API v2
    const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY
    if (!PRINTFUL_API_KEY) {
      return res.status(500).json({ error: "Printful API key not configured" })
    }
    
    console.log("[PRINTFUL ORDER] Sending order to Printful:", JSON.stringify(printfulOrder, null, 2))
    
    const printfulResponse = await fetch('https://api.printful.com/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(printfulOrder)
    })
    
    const printfulResult = await printfulResponse.json()
    
    if (!printfulResponse.ok) {
      console.error("[PRINTFUL ORDER] Failed to create Printful order:", printfulResult)
      return res.status(printfulResponse.status).json({
        error: "Failed to create Printful order",
        details: printfulResult
      })
    }
    
    const printfulOrderData = printfulResult.result
    
    console.log(`[PRINTFUL ORDER] Successfully created Printful order: ${printfulOrderData.id}`)
    
    // TODO: Store the Printful order ID and tracking info in database
    // For now, we'll just return the success response
    
    res.json({
      success: true,
      medusa_order_id,
      printful_order_id: printfulOrderData.id,
      printful_order: printfulOrderData,
      message: "Printful order created successfully"
    })
    
  } catch (error) {
    console.error("[PRINTFUL ORDER] Error creating Printful order:", error)
    res.status(500).json({
      error: "Failed to create Printful order",
      details: error.message
    })
  }
}

export const middlewares = [
  authenticate("admin", ["session", "bearer"]),
]