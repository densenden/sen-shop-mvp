import { MedusaService } from "@medusajs/framework/utils"
import { CustomOrder, CustomOrderItem, CustomOrderShippingAddress } from "../../models/order"

export default class OrderService extends MedusaService({
  CustomOrder,
  CustomOrderItem,
  CustomOrderShippingAddress,
}) {
  async createOrder(data: {
    customer_id: string
    email: string
    currency_code?: string
    items: Array<{
      product_id?: string
      variant_id?: string
      title: string
      quantity: number
      unit_price: number
      metadata?: any
    }>
    shipping_address: {
      first_name: string
      last_name: string
      address_1: string
      address_2?: string
      city: string
      province?: string
      postal_code: string
      country_code: string
      phone?: string
    }
    metadata?: any
  }) {
    // Calculate totals
    let subtotal = 0
    const orderItems = data.items.map(item => {
      const itemTotal = item.unit_price * item.quantity
      subtotal += itemTotal
      return {
        ...item,
        total: itemTotal,
        subtotal: itemTotal,
      }
    })

    // Simple tax calculation (8%)
    const taxTotal = Math.round(subtotal * 0.08)
    
    // Simple shipping calculation
    const shippingTotal = subtotal > 5000 ? 0 : 500 // Free shipping over $50

    const total = subtotal + taxTotal + shippingTotal

    // Generate display ID
    const lastOrder = await this.listCustomOrders(
      {},
      { 
        order: { display_id: "DESC" },
        take: 1
      }
    )
    const displayId = lastOrder.length > 0 ? lastOrder[0].display_id + 1 : 1001

    // Create the order
    const order = await this.createCustomOrders({
      display_id: displayId,
      customer_id: data.customer_id,
      email: data.email,
      currency_code: data.currency_code || "usd",
      status: "pending",
      fulfillment_status: "not_fulfilled",
      payment_status: "captured", // Assuming payment was successful
      total,
      subtotal,
      tax_total: taxTotal,
      shipping_total: shippingTotal,
      metadata: data.metadata,
    })

    // Create order items
    for (const item of orderItems) {
      await this.createCustomOrderItems({
        order_id: order.id,
        ...item,
      })
    }

    // Create shipping address
    await this.createCustomOrderShippingAddresses({
      order_id: order.id,
      ...data.shipping_address,
    })

    // Retrieve the complete order with relations
    return this.retrieveCustomOrder(order.id, {
      relations: ["items", "shipping_address"],
    })
  }

  async listCustomerOrders(customerId: string, options?: any) {
    return this.listCustomOrders(
      { customer_id: customerId },
      {
        ...options,
        relations: ["items", "shipping_address"],
        order: { created_at: "DESC" },
      }
    )
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.updateCustomOrders(orderId, { status })
  }

  async updateFulfillmentStatus(orderId: string, fulfillmentStatus: string) {
    return this.updateCustomOrders(orderId, { fulfillment_status: fulfillmentStatus })
  }

  async updatePaymentStatus(orderId: string, paymentStatus: string) {
    return this.updateCustomOrders(orderId, { payment_status: paymentStatus })
  }
}