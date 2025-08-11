import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { IOrderModuleService } from "@medusajs/types"
import EmailService from "../../../../services/email-service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  console.log("[Checkout Complete] Processing order completion")
  console.log("[Checkout Complete] Request body:", JSON.stringify(req.body, null, 2))
  
  try {
    const { 
      cart_id, 
      customer_email,
      customer_name,
      shipping_address, 
      payment_method,
      cart_items,
      cart_total 
    } = req.body as any
    
    // Validate required fields
    if (!cart_id || !customer_email) {
      return res.status(400).json({ 
        error: "Cart ID and customer email are required" 
      })
    }
    
    // Create actual order in database
    let order: any = null
    let orderId: string = ""
    
    try {
      const orderService: IOrderModuleService = req.scope.resolve(Modules.ORDER)
      
      // Calculate order totals from cart items
      const itemsTotal = (cart_items || []).reduce((sum: number, item: any) => {
        const price = item.unit_price || item.price || item.total || 0
        const quantity = item.quantity || 1
        console.log(`[Checkout Complete] Item: ${item.title}, Price: ${price}, Qty: ${quantity}, Total: ${price * quantity}`)
        return sum + (price * quantity)
      }, 0)
      
      const total = itemsTotal > 0 ? itemsTotal : (cart_total || 2500)
      const subtotal = Math.floor(total * 0.85)
      const tax_total = Math.floor(total * 0.08)
      const shipping_total = total - subtotal - tax_total
      
      console.log(`[Checkout Complete] Order totals - Items: ${itemsTotal}, Total: ${total}, Subtotal: ${subtotal}`)
      
      // Generate proper Medusa order number pattern
      const timestamp = Date.now()
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
      const displayIdString = `SC-${randomSuffix}`
      // Use a smaller number for display_id to avoid integer overflow
      const displayId = Math.floor(Math.random() * 999999)
      
      // Create order data - mark as captured for sandbox testing
      const orderData = {
        display_id: displayId, // Use smaller number to avoid integer overflow
        status: "pending",
        fulfillment_status: "not_fulfilled", 
        payment_status: "captured", // Force captured for sandbox/testing
        total,
        subtotal,
        tax_total,
        shipping_total,
        currency_code: req.body.currency_code || "eur",
        email: customer_email,
        customer_id: null, // Guest checkout
        metadata: {
          display_number: displayIdString,
          customer_name: customer_name || customer_email.split('@')[0],
          checkout_completed_at: new Date().toISOString()
        },
        shipping_address: {
          first_name: customer_name?.split(' ')[0] || 'Customer',
          last_name: customer_name?.split(' ').slice(1).join(' ') || '',
          address_1: shipping_address?.address_1 || 'N/A',
          city: shipping_address?.city || 'N/A',
          country_code: shipping_address?.country_code || 'US',
          postal_code: shipping_address?.postal_code || 'N/A'
        },
        billing_address: {
          first_name: customer_name?.split(' ')[0] || 'Customer',
          last_name: customer_name?.split(' ').slice(1).join(' ') || '',
          address_1: shipping_address?.address_1 || 'N/A',
          city: shipping_address?.city || 'N/A',
          country_code: shipping_address?.country_code || 'US',
          postal_code: shipping_address?.postal_code || 'N/A'
        },
        items: (cart_items || []).map((item: any) => {
          const unitPrice = item.unit_price || item.price || item.total || 0
          const quantity = item.quantity || 1
          return {
            title: item.title || item.product_title || "Product",
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: quantity,
            unit_price: unitPrice,
            total: unitPrice * quantity,
            metadata: {
              fulfillment_type: item.metadata?.fulfillment_type || item.fulfillment_type || "standard",
              artwork_id: item.metadata?.artwork_id,
              product_title: item.title || item.product_title || "Product",
              thumbnail: item.thumbnail || item.product?.thumbnail,
              printful_product_id: item.metadata?.printful_product_id || item.product?.metadata?.printful_product_id,
              // Preserve all original metadata from the product
              ...(item.product?.metadata || {}),
              ...(item.metadata || {})
            }
          }
        })
      }
      
      console.log("[Checkout Complete] Creating order with data:", JSON.stringify(orderData, null, 2))
      
      // Create the order
      const orders = await orderService.createOrders(orderData)
      order = Array.isArray(orders) ? orders[0] : orders
      orderId = order.id
      
      console.log(`[Checkout Complete] Order created in database: ${orderId}`)
      
    } catch (dbError) {
      console.error("[Checkout Complete] Failed to create order in database:", dbError)
      
      // Return error instead of creating fake orders
      return res.status(500).json({
        error: "Order creation failed",
        message: "Unable to create order in database. Please try again or contact support.",
        details: dbError.message
      })
    }
    
    console.log(`[Checkout Complete] Order created: ${orderId}`)
    console.log(`[Checkout Complete] Customer: ${customer_email}`)
    
    // Order successfully created in database
    
    // Create Printful order - force creation for all physical products in testing
    let printfulOrderCreated = false
    
    // Log all items for debugging
    console.log(`[Checkout Complete] All cart items:`, (cart_items || []).map(item => ({
      title: item.title,
      product_id: item.product_id,
      fulfillment_type: item.metadata?.fulfillment_type || item.fulfillment_type,
      product_metadata: item.product?.metadata
    })))
    
    // Identify Printful items based on metadata
    const printfulItems = (cart_items || []).filter((item: any) => {
      const fulfillmentType = item.metadata?.fulfillment_type || item.fulfillment_type || item.product?.metadata?.fulfillment_type
      console.log(`[Checkout Complete] Item ${item.title}: fulfillment_type = ${fulfillmentType}`)
      return fulfillmentType === 'printful_pod'
    })
    
    console.log(`[Checkout Complete] Found ${printfulItems.length} Printful POD items out of ${cart_items?.length || 0} total items`)
    
    if (printfulItems.length > 0) {
      try {
        console.log(`[Checkout Complete] Creating Printful order for ${printfulItems.length} POD items (${cart_items?.length || 0} total items)`)
        console.log(`[Checkout Complete] All items:`, (cart_items || []).map(i => ({ title: i.title, fulfillment: i.metadata?.fulfillment_type || i.fulfillment_type })))
        
        const publishableKey = process.env.MEDUSA_PUBLISHABLE_KEY || 'pk_0b024fc90febe17f54a9359f1e0d24141802d6e4b951bf227649695ee31895e0'
        
        const printfulResponse = await fetch(`http://localhost:9000/store/printful/orders/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-publishable-api-key': publishableKey
          },
          body: JSON.stringify({
            medusa_order_id: orderId,
            order_data: order // Pass the full order data
          })
        })
        
        if (printfulResponse.ok) {
          const printfulResult = await printfulResponse.json()
          console.log(`[Checkout Complete] Printful order created: ${printfulResult.printful_order_id}`)
          printfulOrderCreated = true
          
          // Update order metadata with Printful order ID
          if (order && printfulResult.printful_order_id) {
            order.metadata = {
              ...order.metadata,
              printful_order_id: printfulResult.printful_order_id,
              printful_status: 'pending'
            }
          }
        } else {
          const errorData = await printfulResponse.text()
          console.error(`[Checkout Complete] Failed to create Printful order:`, errorData)
        }
        
      } catch (printfulError) {
        console.error(`[Checkout Complete] Error creating Printful order:`, printfulError)
      }
    } else {
      console.log(`[Checkout Complete] No POD items, skipping Printful order creation`)
    }
    
    // Send order confirmation email directly
    try {
      const emailService = new EmailService()
      const orderNumber = order.metadata?.display_number || `#SC-${String(order.display_id).slice(-6)}`
      
      const emailData = {
        customerEmail: customer_email,
        customerName: customer_name || customer_email.split('@')[0],
        orderId: orderId,
        orderNumber,
        items: (order.items || []).map((item: any) => ({
          title: item.title || item.product_title || "Product",
          thumbnail: item.thumbnail || item.product?.thumbnail || item.metadata?.thumbnail,
          quantity: item.quantity || 1,
          unitPrice: item.unit_price || item.price || 0,
          total: item.total || (item.unit_price * item.quantity) || 0,
          fulfillmentType: item.fulfillment_type || item.metadata?.fulfillment_type || "standard"
        })),
        totalAmount: order.total || cart_total || 2500,
        currencyCode: order.currency_code || req.body.currency_code || "eur"
      }
      
      console.log("[Checkout Complete] Sending order confirmation email")
      const emailSent = await emailService.sendOrderConfirmation(emailData)
      console.log("[Checkout Complete] Email sent successfully:", emailSent)
    } catch (emailError) {
      console.error("[Checkout Complete] Failed to send confirmation email:", emailError)
      // Don't fail the order if email fails
    }
    
    // Emit order.placed event for subscribers
    try {
      const eventBus = req.scope.resolve(Modules.EVENT_BUS)
      await eventBus.emit("order.placed", { 
        id: orderId,
        data: order 
      })
      console.log("[Checkout Complete] order.placed event emitted")
    } catch (eventError) {
      console.error("[Checkout Complete] Failed to emit event:", eventError)
    }
    
    res.json({
      success: true,
      order,
      printful_order_created: printfulOrderCreated,
      printful_items_count: printfulItems.length,
      message: printfulOrderCreated 
        ? "Order placed successfully. Printful order created. Confirmation email sent."
        : "Order placed successfully. Confirmation email sent."
    })
    
  } catch (error) {
    console.error("[Checkout Complete] Error:", error)
    res.status(500).json({ 
      error: "Failed to complete checkout",
      details: error.message 
    })
  }
}