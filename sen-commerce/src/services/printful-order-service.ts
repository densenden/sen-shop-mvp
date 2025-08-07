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
  external_id?: string
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

export default class PrintfulOrderService extends MedusaService({}) {
  private apiToken: string
  private apiBaseUrl: string

  constructor(container: any, options?: any) {
    super(container, options)
    this.apiToken = process.env.PRINTFUL_API_TOKEN || ""
    this.apiBaseUrl = "https://api.printful.com"
    
    if (!this.apiToken) {
      console.warn("PRINTFUL_API_TOKEN not configured - Printful order functionality will not work")
    } else {
      console.log("PrintfulOrderService initialized with API token")
    }
  }

  // Create order in Printful
  async createOrder(orderData: PrintfulV2OrderRequest): Promise<PrintfulV2Order | null> {
    if (!this.apiToken) {
      console.error("PrintfulOrderService: Cannot create order - PRINTFUL_API_TOKEN not configured")
      console.error("PrintfulOrderService: Available env vars:", Object.keys(process.env).filter(k => k.includes('PRINTFUL')))
      return null
    }

    try {
      console.log("PrintfulOrderService: Creating order with data:", JSON.stringify(orderData, null, 2))
      
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
        console.error("PrintfulOrderService: Order creation error:", res.status, errorText)
        throw new Error(`Failed to create order in Printful: ${errorText}`)
      }

      const data = await res.json()
      console.log("PrintfulOrderService: Order created successfully:", data.result.id)
      return data.result
    } catch (error) {
      console.error("PrintfulOrderService: Error creating order:", error)
      return null
    }
  }

  // Get order from Printful
  async getOrder(orderId: string): Promise<PrintfulV2Order | null> {
    if (!this.apiToken) return null
    
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
}