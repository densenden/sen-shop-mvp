import { MedusaService } from "@medusajs/framework/utils"

interface PrintfulV2Order {
  id: string
  status: string
  items: PrintfulV2OrderItem[]
  shipping: PrintfulV2ShippingInfo
  total: number
  currency: string
  created_at: string
  updated_at: string
  tracking_number?: string
  tracking_url?: string
}

interface PrintfulV2OrderItem {
  id: string
  variant_id: string
  quantity: number
  price: number
  files: PrintfulV2File[]
  name: string
}

interface PrintfulV2File {
  id: string
  type: string
  url: string
  preview_url: string
}

interface PrintfulV2ShippingInfo {
  name: string
  address1: string
  address2?: string
  city: string
  state_code: string
  country_code: string
  zip: string
  phone?: string
  email?: string
}

interface PrintfulV2OrderRequest {
  recipient: PrintfulV2ShippingInfo
  items: PrintfulV2OrderRequestItem[]
  retail_costs?: {
    currency: string
    subtotal?: number
    discount?: number
    shipping?: number
    tax?: number
  }
}

interface PrintfulV2OrderRequestItem {
  variant_id: string
  quantity: number
  files: PrintfulV2File[]
  retail_price?: number
}

export class PrintfulOrderService extends MedusaService({}) {
  private apiToken: string
  private apiBaseUrl: string

  constructor(container: any, options?: any) {
    super(container, options)
    this.apiToken = process.env.PRINTFUL_API_TOKEN || ""
    this.apiBaseUrl = "https://api.printful.com"
  }

  // Create order in Printful
  async createOrder(orderData: PrintfulV2OrderRequest): Promise<PrintfulV2Order> {
    const res = await fetch(`${this.apiBaseUrl}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful order creation error:", res.status, errorText)
      throw new Error(`Failed to create order in Printful: ${errorText}`)
    }

    const data = await res.json()
    return data.result
  }

  // Get order from Printful
  async getOrder(orderId: string): Promise<PrintfulV2Order | null> {
    const res = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      if (res.status === 404) return null
      const errorText = await res.text()
      console.error("Printful order fetch error:", res.status, errorText)
      throw new Error(`Failed to fetch order from Printful: ${errorText}`)
    }

    const data = await res.json()
    return data.result
  }

  // Update order in Printful
  async updateOrder(orderId: string, orderData: Partial<PrintfulV2OrderRequest>): Promise<PrintfulV2Order> {
    const res = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful order update error:", res.status, errorText)
      throw new Error(`Failed to update order in Printful: ${errorText}`)
    }

    const data = await res.json()
    return data.result
  }

  // Cancel order in Printful
  async cancelOrder(orderId: string): Promise<boolean> {
    const res = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.apiToken}`
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful order cancellation error:", res.status, errorText)
      throw new Error(`Failed to cancel order in Printful: ${errorText}`)
    }

    return true
  }

  // Get all orders from Printful
  async getOrders(params?: {
    status?: string
    offset?: number
    limit?: number
  }): Promise<PrintfulV2Order[]> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append('status', params.status)
    if (params?.offset) searchParams.append('offset', params.offset.toString())
    if (params?.limit) searchParams.append('limit', params.limit.toString())

    const url = `${this.apiBaseUrl}/orders${searchParams.toString() ? '?' + searchParams.toString() : ''}`
    
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful orders fetch error:", res.status, errorText)
      throw new Error(`Failed to fetch orders from Printful: ${errorText}`)
    }

    const data = await res.json()
    return data.result || []
  }

  // Confirm order for fulfillment
  async confirmOrder(orderId: string): Promise<PrintfulV2Order> {
    const res = await fetch(`${this.apiBaseUrl}/orders/${orderId}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful order confirmation error:", res.status, errorText)
      throw new Error(`Failed to confirm order in Printful: ${errorText}`)
    }

    const data = await res.json()
    return data.result
  }

  // Estimate shipping costs
  async estimateShippingCosts(recipient: PrintfulV2ShippingInfo, items: PrintfulV2OrderRequestItem[]): Promise<any> {
    const res = await fetch(`${this.apiBaseUrl}/shipping/rates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipient,
        items
      })
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error("Printful shipping estimation error:", res.status, errorText)
      throw new Error(`Failed to estimate shipping costs: ${errorText}`)
    }

    const data = await res.json()
    return data.result
  }

  // Convert Medusa order to Printful order format
  async convertMedusaOrderToPrintful(medusaOrder: any): Promise<PrintfulV2OrderRequest> {
    const shippingAddress = medusaOrder.shipping_address
    const items = medusaOrder.items || []

    const recipient: PrintfulV2ShippingInfo = {
      name: `${shippingAddress.first_name} ${shippingAddress.last_name}`,
      address1: shippingAddress.address_1,
      address2: shippingAddress.address_2,
      city: shippingAddress.city,
      state_code: shippingAddress.province,
      country_code: shippingAddress.country_code,
      zip: shippingAddress.postal_code,
      phone: shippingAddress.phone,
      email: medusaOrder.email
    }

    const printfulItems: PrintfulV2OrderRequestItem[] = []
    
    for (const item of items) {
      // Only process items that are Printful products
      if (item.metadata?.product_type === 'printful_pod') {
        printfulItems.push({
          variant_id: item.variant_id,
          quantity: item.quantity,
          files: item.metadata?.files || [],
          retail_price: item.unit_price
        })
      }
    }

    return {
      recipient,
      items: printfulItems,
      retail_costs: {
        currency: medusaOrder.currency_code,
        subtotal: medusaOrder.subtotal,
        discount: medusaOrder.discount_total,
        shipping: medusaOrder.shipping_total,
        tax: medusaOrder.tax_total
      }
    }
  }
}